import db from "../../config/db";
import { Contact } from "./contact.types";

export class ContactRepository {
  async findMatches(email?: string, phoneNumber?: string) {
    return db("contacts")
      .where((qb) => {
        if (email) qb.orWhere("email", email);
        if (phoneNumber) qb.orWhere("phoneNumber", phoneNumber);
      })
      .whereNull("deletedAt");
  }

  async findByPrimary(primaryId: number) {
    return db("contacts")
      .where("id", primaryId)
      .orWhere("linkedId", primaryId)
      .whereNull("deletedAt");
  }

  async create(data: Partial<Contact>) {
    const [created] = await db("contacts")
      .insert(data)
      .returning("*");

    return created;
  }

  async update(id: number, data: Partial<Contact>) {
    await db("contacts")
      .where("id", id)
      .update(data);
  }
}