import db from "../../config/db";
import { ContactRepository } from "./contact.repository";
import { IdentifyRequest } from "./contact.types";
import { AppError } from "../../utils/AppError";

export class ContactService {
  private repo = new ContactRepository();

  async identify(data: IdentifyRequest) {
    const { email, phoneNumber } = data;

    if (!email && !phoneNumber) {
      throw new AppError("Email or phoneNumber is required", 400);
    }

    return db.transaction(async (trx) => {
      // Find matches inside transaction
      const matches = await this.repo.findMatches(
        email,
        phoneNumber,
        trx
      );

      // CASE 1: No match
      if (matches.length === 0) {
        const created = await this.repo.create(
          {
            email: email ?? null,
            phoneNumber: phoneNumber ?? null,
            linkPrecedence: "primary",
            linkedId: null,
          },
          trx
        );

        return this.buildResponse([created]);
      }

      // Collect all primary IDs involved
      const primaryIds = new Set<number>();

      for (const contact of matches) {
        if (contact.linkPrecedence === "primary") {
          primaryIds.add(contact.id);
        } else if (contact.linkedId) {
          primaryIds.add(contact.linkedId);
        }
      }

      // Get full groups
      let allContacts: any[] = [];

      for (const primaryId of primaryIds) {
        const group = await this.repo.findByPrimary(primaryId, trx);
        allContacts.push(...group);
      }

      // Merge multiple primaries
      const primaryContacts = allContacts.filter(
        (c) => c.linkPrecedence === "primary"
      );

      const finalPrimary = primaryContacts.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      )[0];

      for (const primary of primaryContacts) {
        if (primary.id !== finalPrimary.id) {
          await this.repo.update(
            primary.id,
            {
              linkPrecedence: "secondary",
              linkedId: finalPrimary.id,
            },
            trx
          );
        }
      }

      // Refresh unified group
      allContacts = await this.repo.findByPrimary(
        finalPrimary.id,
        trx
      );

      const existingEmails = new Set(
        allContacts.map((c) => c.email).filter(Boolean)
      );

      const existingPhones = new Set(
        allContacts.map((c) => c.phoneNumber).filter(Boolean)
      );

      const isNewEmail = email && !existingEmails.has(email);
      const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

      // Insert new secondary if needed
      if (isNewEmail || isNewPhone) {
        const newSecondary = await this.repo.create(
          {
            email: email ?? null,
            phoneNumber: phoneNumber ?? null,
            linkPrecedence: "secondary",
            linkedId: finalPrimary.id,
          },
          trx
        );

        allContacts.push(newSecondary);
      }

      return this.buildResponse(allContacts);
    });
  }

  private buildResponse(contacts: any[]) {
    const primary = contacts.find(
      (c) => c.linkPrecedence === "primary"
    );

    const secondaryIds = contacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    const emails = [
      primary.email,
      ...contacts
        .filter((c) => c.id !== primary.id)
        .map((c) => c.email)
        .filter(Boolean),
    ];

    const phones = [
      primary.phoneNumber,
      ...contacts
        .filter((c) => c.id !== primary.id)
        .map((c) => c.phoneNumber)
        .filter(Boolean),
    ];

    return {
      contact: {
        primaryContactId: primary.id,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phones)],
        secondaryContactIds: secondaryIds,
      },
    };
  }
}