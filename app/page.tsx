import Link from "next/link";

async function fetchHealth(): Promise<{ ok: boolean; message: string }> {
  return { ok: true, message: "Aplica??o pronta" };
}

export default async function HomePage() {
  const health = await fetchHealth();
  return (
    <main>
      <header>
        <h1>Agente de Agendamento via WhatsApp</h1>
      </header>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Vis?o Geral</h2>
          <p>
            Este servi?o recebe mensagens do WhatsApp (Cloud API), conduz o paciente
            pelo fluxo de agendamento e confirma o hor?rio conforme disponibilidade.
          </p>
          <p>
            Webhook: <code>/api/whatsapp/webhook</code>
          </p>
          <p>
            Status: <span className="badge">{health.ok ? "OK" : "Indispon?vel"}</span>
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/admin">Abrir Painel Administrativo</Link>
          </div>
        </section>

        <section className="card">
          <h2>Configura??o Necess?ria</h2>
          <ul>
            <li>Definir vari?veis de ambiente: <code>WHATSAPP_VERIFY_TOKEN</code>, <code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>, <code>ADMIN_TOKEN</code>.</li>
            <li>Apontar o webhook no WhatsApp Cloud API para <code>/api/whatsapp/webhook</code>.</li>
          </ul>
        </section>
      </div>

      <footer>
        &copy; {new Date().getFullYear()} Consult?rio Odontol?gico
      </footer>
    </main>
  );
}
