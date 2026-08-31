import { useEffect, useMemo, useState } from 'react'

const roles = ['Residente', 'Tesorería', 'Secretaría', 'Mesa Directiva', 'Administrador']
const initialHomes = [
  { id: 1, number: 'A-01', address: 'Calle Roble 101', status: 'Activa' },
  { id: 2, number: 'A-02', address: 'Calle Roble 103', status: 'Activa' },
]
const initialResidents = [
  { id: 1, name: 'María González', email: 'maria@robles.mx', home: 'A-01', role: 'Residente', consent: true },
]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}

export default function App() {
  const [tab, setTab] = useState('inicio')
  const [homes, setHomes] = useState(() => load('robles-homes', initialHomes))
  const [residents, setResidents] = useState(() => load('robles-residents', initialResidents))
  const [message, setMessage] = useState('')
  const [homeForm, setHomeForm] = useState({ number: '', address: '' })
  const [residentForm, setResidentForm] = useState({ name: '', email: '', home: '', role: 'Residente', consent: false })
  useEffect(() => localStorage.setItem('robles-homes', JSON.stringify(homes)), [homes])
  useEffect(() => localStorage.setItem('robles-residents', JSON.stringify(residents)), [residents])
  const activeHomes = homes.filter(h => h.status === 'Activa').length
  const canRegister = homes.length > 0
  const roleSummary = useMemo(() => roles.map(role => ({ role, count: residents.filter(r => r.role === role).length })), [residents])

  function notify(text) { setMessage(text); window.setTimeout(() => setMessage(''), 3600) }
  function addHome(e) {
    e.preventDefault()
    if (!homeForm.number.trim() || !homeForm.address.trim()) return notify('Completa el número y la dirección de la vivienda.')
    if (homes.some(h => h.number.toLowerCase() === homeForm.number.trim().toLowerCase())) return notify('Ese número de vivienda ya está registrado.')
    setHomes([...homes, { id: Date.now(), number: homeForm.number.trim(), address: homeForm.address.trim(), status: 'Activa' }])
    setHomeForm({ number: '', address: '' }); notify('Vivienda registrada correctamente.')
  }
  function addResident(e) {
    e.preventDefault()
    if (!residentForm.name.trim() || !residentForm.email.trim() || !residentForm.home) return notify('Completa los datos y selecciona una vivienda.')
    if (!residentForm.consent) return notify('No se puede registrar al usuario sin aceptar el aviso de privacidad.')
    if (residents.some(r => r.email.toLowerCase() === residentForm.email.trim().toLowerCase())) return notify('El correo ya está registrado.')
    setResidents([...residents, { id: Date.now(), ...residentForm, name: residentForm.name.trim(), email: residentForm.email.trim() }])
    setResidentForm({ name: '', email: '', home: '', role: 'Residente', consent: false }); notify('Usuario vinculado a la vivienda y con rol asignado.')
  }
  function removeResident(id) { setResidents(residents.filter(r => r.id !== id)); notify('Usuario eliminado del padrón.') }

  return <div className="app-shell">
    <aside>
      <div className="brand"><span>MR</span><div><strong>Mi Comunidad</strong><small>Los Robles</small></div></div>
      <nav>{[
        ['inicio', '⌂', 'Resumen'], ['viviendas', '⌂', 'Viviendas'], ['residentes', '♙', 'Usuarios y acceso'], ['sprint', '◷', 'Sprint 1'],
      ].map(([id, icon, label]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? 'active' : ''}><i>{icon}</i>{label}</button>)}</nav>
      <div className="sprint-label">SPRINT ACTIVO<br/><b>1 · Padrón y acceso</b></div>
    </aside>
    <main>
      <header><div><p className="eyebrow">PLATAFORMA COMUNITARIA</p><h1>{tab === 'inicio' ? 'Panel de administración' : tab === 'viviendas' ? 'Padrón de viviendas' : tab === 'residentes' ? 'Usuarios, roles y privacidad' : 'Sprint 1'}</h1></div><div className="avatar">JC</div></header>
      {message && <div className="toast" role="status">{message}</div>}
      {tab === 'inicio' && <section><div className="hero"><div><p>Todo comienza con un padrón confiable.</p><h2>Acceso ordenado para una comunidad más conectada.</h2><button onClick={() => setTab('residentes')}>Registrar usuario</button></div><div className="hero-mark">⌂</div></div><div className="stats"><Card value={activeHomes} label="Viviendas activas" /><Card value={residents.length} label="Usuarios registrados" /><Card value={residents.filter(r => r.consent).length} label="Consentimientos vigentes" /></div><section className="panel"><h2>Estado del Sprint 1</h2><div className="progress"><span style={{ width: `${Math.min(100, Math.round(((homes.length + residents.length) / 8) * 100))}%` }} /></div><p>Objetivo: registrar viviendas y residentes, aplicar roles y proteger la información personal mediante consentimiento.</p></section></section>}
      {tab === 'viviendas' && <section className="two-columns"><form className="panel" onSubmit={addHome}><h2>Registrar vivienda</h2><label>Número o clave<input value={homeForm.number} onChange={e => setHomeForm({ ...homeForm, number: e.target.value })} placeholder="Ej. B-12" /></label><label>Dirección<input value={homeForm.address} onChange={e => setHomeForm({ ...homeForm, address: e.target.value })} placeholder="Ej. Calle Roble 120" /></label><button type="submit">Guardar vivienda</button></form><div className="panel"><h2>Viviendas registradas</h2><div className="records">{homes.map(home => <div className="record" key={home.id}><div><b>{home.number}</b><small>{home.address}</small></div><span className="badge">{home.status}</span></div>)}</div></div></section>}
      {tab === 'residentes' && <section className="two-columns"><form className="panel" onSubmit={addResident}><h2>Alta de usuario</h2><label>Nombre completo<input value={residentForm.name} onChange={e => setResidentForm({ ...residentForm, name: e.target.value })} placeholder="Nombre y apellidos" /></label><label>Correo electrónico<input type="email" value={residentForm.email} onChange={e => setResidentForm({ ...residentForm, email: e.target.value })} placeholder="correo@ejemplo.com" /></label><label>Vivienda<select disabled={!canRegister} value={residentForm.home} onChange={e => setResidentForm({ ...residentForm, home: e.target.value })}><option value="">Selecciona una vivienda</option>{homes.filter(h => h.status === 'Activa').map(h => <option key={h.id}>{h.number}</option>)}</select></label><label>Rol<select value={residentForm.role} onChange={e => setResidentForm({ ...residentForm, role: e.target.value })}>{roles.map(role => <option key={role}>{role}</option>)}</select></label><label className="consent"><input type="checkbox" checked={residentForm.consent} onChange={e => setResidentForm({ ...residentForm, consent: e.target.checked })}/><span>Acepto el aviso de privacidad y el tratamiento de mis datos para la operación de la comunidad.</span></label><button type="submit">Crear usuario</button></form><div className="panel"><h2>Usuarios registrados</h2><div className="records">{residents.map(resident => <div className="record resident" key={resident.id}><div><b>{resident.name}</b><small>{resident.email} · Vivienda {resident.home}</small></div><div><span className="badge dark">{resident.role}</span><button className="icon-button" title="Eliminar usuario" onClick={() => removeResident(resident.id)}>×</button></div></div>)}</div><h3>Roles asignados</h3><div className="roles">{roleSummary.map(item => <span key={item.role}>{item.role}: <b>{item.count}</b></span>)}</div></div></section>}
      {tab === 'sprint' && <section><div className="panel"><p className="eyebrow">PLANIFICACIÓN DEL SPRINT</p><h2>ROBLES-PB-01 · Padrón, usuarios y acceso</h2><p><b>Duración:</b> 10 días hábiles &nbsp; <b>Estimación:</b> 80 h &nbsp; <b>Prioridad:</b> Máxima</p><p><b>Definición de terminado:</b> vivienda y usuario vinculados, permisos aplicados, consentimiento obligatorio y pruebas de acceso aprobadas.</p></div><div className="sprint-board">{['Por hacer', 'En proceso', 'Hecho'].map((column, index) => <div className="board-column" key={column}><h3>{column}</h3>{[['Modelo de padrón', '16 h'], ['Registro y vinculación', '16 h'], ['Roles y permisos', '16 h'], ['Privacidad y consentimiento', '8 h'], ['Administración de usuarios', '16 h'], ['Pruebas de aceptación', '8 h']].filter((_, i) => index === 0 ? i > 1 : index === 1 ? i <= 1 : false).map(([task, time]) => <div className="task" key={task}><b>{task}</b><small>{time}</small></div>)}{index === 2 && <p className="empty">Aún no hay tareas terminadas.</p>}</div>)}</div></section>}
    </main>
  </div>
}
function Card({ value, label }) { return <div className="stat"><b>{value}</b><span>{label}</span></div> }
