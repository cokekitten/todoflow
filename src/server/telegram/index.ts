interface SendMessageResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<SendMessageResult> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    const data = (await response.json()) as { ok?: boolean; description?: string };

    if (!data.ok) {
      return { ok: false, error: data.description || "Unknown Telegram API error" };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
