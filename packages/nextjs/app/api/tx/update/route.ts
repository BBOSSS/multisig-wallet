import { Transaction, updateSignaturesAndSigners } from "~~/utils/postgres/transaction";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await updateSignaturesAndSigners(body);
    return Response.json({ message: "success" });
  } catch (error) {
    console.log("Error update transaction", error);
    return Response.error();
  }
}
