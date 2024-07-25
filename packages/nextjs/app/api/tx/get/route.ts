import { getTransactions } from "~~/utils/postgres/transaction";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await getTransactions(body);
    return Response.json(res);
  } catch (error) {
    console.log("Error create transaction", error);
    return Response.error();
  }
}
