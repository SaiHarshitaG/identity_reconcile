import { ContactRepository } from "./contact.repository";
import { IdentifyRequest } from "./contact.types";
import { AppError } from "../../utils/AppError";

export class ContactService {
  private repo = new ContactRepository();

  async identify(data: IdentifyRequest) {
    const { email, phoneNumber } = data;

    // Validation
    if (!email && !phoneNumber) {
      throw new AppError("Email or phoneNumber is required", 400);
    }

    const matches = await this.repo.findMatches(email, phoneNumber);

    // CASE 1: No match → create primary
    if (matches.length === 0) {
      const created = await this.repo.create({
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: "primary",
        linkedId: null,
      });

      return this.buildResponse([created]);
    }

    // STEP 1: Find all involved primary IDs
    const primaryIds = new Set<number>();

    for (const contact of matches) {
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // STEP 2: Fetch all contacts from all matched primary groups
    let allContacts: any[] = [];

    for (const primaryId of primaryIds) {
      const group = await this.repo.findByPrimary(primaryId);
      allContacts.push(...group);
    }

    // STEP 3: If multiple primaries → merge them
    const primaryContacts = allContacts.filter(
      (c) => c.linkPrecedence === "primary"
    );

    let finalPrimary = primaryContacts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    )[0]; // oldest primary

    for (const primary of primaryContacts) {
      if (primary.id !== finalPrimary.id) {
        // Convert newer primary → secondary
        await this.repo.update(primary.id, {
          linkPrecedence: "secondary",
          linkedId: finalPrimary.id,
        });
      }
    }

    // Re-fetch unified group
    allContacts = await this.repo.findByPrimary(finalPrimary.id);

    // Collect existing data
    const emails = new Set(
      allContacts.map((c) => c.email).filter(Boolean)
    );

    const phones = new Set(
      allContacts.map((c) => c.phoneNumber).filter(Boolean)
    );

    const isNewEmail = email && !emails.has(email);
    const isNewPhone = phoneNumber && !phones.has(phoneNumber);

    // CASE 2: New info → create secondary
    if (isNewEmail || isNewPhone) {
      const newSecondary = await this.repo.create({
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: "secondary",
        linkedId: finalPrimary.id,
      });

      allContacts.push(newSecondary);
    }

    return this.buildResponse(allContacts);
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