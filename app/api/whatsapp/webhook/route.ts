import { NextRequest, NextResponse } from "next/server";
import { Store, type SessionState } from "@/lib/store";
import { extractIncomingMessages, sendWhatsAppText } from "@/lib/whatsapp";
import { getAvailability, schedule } from "@/lib/scheduler";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function normalize(text?: string) {
  return (text || "").trim();
}

function isDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isTimeStr(s: string) {
  return /^\d{2}:\d{2}$/.test(s);
}

async function handleConversation(phone: string, text: string) {
  const incoming = normalize(text);
  let session = Store.getSession(phone) as SessionState | undefined;

  if (!session || session.step === "init") {
    session = { step: "ask_name" };
    Store.setSession(phone, session);
    await sendWhatsAppText(
      phone,
      "Ol?! Sou o assistente do consult?rio odontol?gico. Como posso te chamar?"
    );
    return;
  }

  if (session.step === "ask_name") {
    const name = incoming || "Paciente";
    Store.setSession(phone, { step: "ask_date", name });
    await sendWhatsAppText(
      phone,
      "Prazer, " + name + "! Informe a data desejada no formato AAAA-MM-DD (ex: 2025-12-30)."
    );
    return;
  }

  if (session.step === "ask_date") {
    if (!isDateStr(incoming)) {
      await sendWhatsAppText(phone, "Por favor, envie a data no formato AAAA-MM-DD.");
      return;
    }
    const avail = getAvailability(incoming);
    if (!avail.isBusinessDay) {
      await sendWhatsAppText(phone, "Nesta data n?o atendemos. Tente um dia ?til.");
      return;
    }
    if (avail.slots.length === 0) {
      await sendWhatsAppText(phone, "Sem hor?rios livres nesta data. Informe outra data.");
      return;
    }
    const times = avail.slots.slice(0, 8).join(", ");
    await sendWhatsAppText(
      phone,
      `Hor?rios dispon?veis em ${incoming}: ${times}. Informe o hor?rio desejado (HH:mm).`
    );
    Store.setSession(phone, { step: "ask_time", name: session.name, date: incoming });
    return;
  }

  if (session.step === "ask_time") {
    if (!isTimeStr(incoming)) {
      await sendWhatsAppText(phone, "Informe o hor?rio no formato HH:mm (ex: 14:30).");
      return;
    }
    const okTimes = getAvailability(session.date).slots;
    if (!okTimes.includes(incoming)) {
      await sendWhatsAppText(phone, "Hor?rio indispon?vel. Envie outro hor?rio dentro dos dispon?veis.");
      return;
    }
    Store.setSession(phone, {
      step: "ask_reason",
      name: session.name,
      date: session.date,
      time: incoming,
    });
    await sendWhatsAppText(phone, "Qual o motivo da consulta? (Ex: Limpeza, dor de dente, avalia??o)");
    return;
  }

  if (session.step === "ask_reason") {
    const reason = incoming || "Consulta";
    const nextState: SessionState = {
      step: "confirm",
      name: session.name,
      date: session.date,
      time: session.time,
      reason,
    };
    Store.setSession(phone, nextState);
    await sendWhatsAppText(
      phone,
      `Confirma agendamento para ${session.date} ?s ${session.time} para ${reason}? Responda SIM ou NAO.`
    );
    return;
  }

  if (session.step === "confirm") {
    const ans = incoming.toLowerCase();
    if (ans === "sim" || ans === "s" || ans === "confirmo") {
      const res = schedule(session.name, phone, session.date, session.time, session.reason);
      if (!res.ok) {
        await sendWhatsAppText(phone, `N?o foi poss?vel agendar: ${res.error}`);
        Store.clearSession(phone);
        return;
      }
      await sendWhatsAppText(
        phone,
        `Agendamento confirmado para ${res.humanTime}. Obrigado, ${session.name}!`
      );
      Store.clearSession(phone);
      return;
    } else if (ans === "nao" || ans === "n?o" || ans === "n") {
      await sendWhatsAppText(phone, "Tudo bem, cancelado. Se precisar, podemos tentar outro hor?rio.");
      Store.clearSession(phone);
      return;
    } else {
      await sendWhatsAppText(phone, "Por favor, responda SIM ou NAO para confirmar.");
      return;
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = extractIncomingMessages(body);
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ ok: true });
  }
  // Process sequentially to keep order
  for (const m of messages) {
    if (m.type === "text" && m.text?.body) {
      await handleConversation(m.from, m.text.body);
    } else {
      await sendWhatsAppText(m.from, "Desculpe, entendi apenas mensagens de texto.");
    }
  }
  return NextResponse.json({ ok: true });
}
