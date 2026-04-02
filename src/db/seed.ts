import { db } from "./index";
import { user, transaction } from "./schema/schema";

async function seed() {
  const hashPassword = Bun.password.hash();
  // 2. insert three users (admin, analyst, viewer)
  // 3. insert 15-20 transactions linked to the admin user's id
  // 4. console.log('seeded successfully') and process.exit(0)
}

seed();
