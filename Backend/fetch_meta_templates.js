import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const apiVersion = process.env.WHATSAPP_API_VERSION || "v25.0";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

async function main() {
    console.log("Fetching /me/permissions details...");
    const permRes = await axios.get(
      `https://graph.facebook.com/${apiVersion}/me/permissions`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("Token permissions:", permRes.data);

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

main();
