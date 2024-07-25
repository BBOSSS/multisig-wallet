import { insertTransaction } from "~~/utils/postgres/transaction";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await insertTransaction(body);
    return Response.json({ message: "success" });
  } catch (error) {
    console.log("Error create transaction", error);
    return Response.error();
  }
}
