"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  reason: string;
  createdAt: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<Appointment[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [availability, setAvailability] = useState<{ slots: string[]; isBusinessDay: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.localStorage.getItem("ADMIN_TOKEN") || "";
    setToken(t);
  }, []);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao carregar agendamentos");
      const json = await res.json();
      setItems(json.items);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadAvailability() {
    setError(null);
    try {
      const res = await fetch(`/api/admin/availability?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao carregar disponibilidade");
      const json = await res.json();
      setAvailability({ slots: json.slots, isBusinessDay: json.isBusinessDay });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function clearAll() {
    if (!confirm("Deseja realmente apagar todos os dados (sess?es e agendamentos)?")) return;
    const res = await fetch("/api/admin/appointments", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setItems([]);
      setAvailability(null);
    }
  }

  function saveToken() {
    window.localStorage.setItem("ADMIN_TOKEN", token);
    load();
  }

  return (
    <main>
      <header>
        <h1>Painel Administrativo</h1>
      </header>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <div>
            <label>Admin Token</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o ADMIN_TOKEN" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <button className="btn" onClick={saveToken}>Salvar e Carregar</button>
            <button className="btn secondary" onClick={clearAll}>Apagar Tudo</button>
          </div>
        </div>
        {error && <p style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p>}
      </div>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2 className="section-title">Agendamentos</h2>
          <button className="btn" onClick={load}>Recarregar</button>
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Telefone</th>
                <th>Motivo</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.patientName}</td>
                  <td>{a.phone}</td>
                  <td>{a.reason}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "#6b7280" }}>Sem agendamentos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="section-title">Disponibilidade</h2>
          <div className="row">
            <div>
              <label>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button className="btn" onClick={loadAvailability}>Ver Disponibilidade</button>
            </div>
          </div>
          {availability && (
            <div style={{ marginTop: 12 }}>
              <p>
                Dia ?til? {availability.isBusinessDay ? "Sim" : "N?o"}
              </p>
              <p>
                Hor?rios livres: {availability.slots.length > 0 ? availability.slots.join(", ") : "Nenhum"}
              </p>
            </div>
          )}
        </div>
      </section>

      <footer>
        &copy; {new Date().getFullYear()} Consult?rio Odontol?gico
      </footer>
    </main>
  );
}
