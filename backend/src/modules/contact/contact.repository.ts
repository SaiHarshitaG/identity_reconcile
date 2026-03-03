import { Knex } from "knex";
import db from "../../config/db";
import { Contact } from "./contact.types";

export class ContactRepository {
  private table = "contacts";

  async findMatches(
    email?: string,
    phoneNumber?: string,
    trx?: Knex.Transaction
  ) {
    const query = (trx ?? db)(this.table)
      .where((qb) => {
        if (email) qb.orWhere("email", email);
        if (phoneNumber) qb.orWhere("phoneNumber", phoneNumber);
      })
      .whereNull("deletedAt");

    return query;
  }

  async findByPrimary(primaryId: number, trx?: Knex.Transaction) {
    return (trx ?? db)(this.table)
      .where("id", primaryId)
      .orWhere("linkedId", primaryId)
      .whereNull("deletedAt");
  }

  async create(data: Partial<Contact>, trx?: Knex.Transaction) {
    const [created] = await (trx ?? db)(this.table)
      .insert(data)
      .returning("*");

    return created;
  }

  async update(id: number, data: Partial<Contact>, trx?: Knex.Transaction) {
    return (trx ?? db)(this.table)
      .where("id", id)
      .update(data);
  }
}