import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search, MapPin, CalendarDays, ArrowRight, PlusCircle, ShieldCheck, PackageSearch, Menu, X, LogIn, UserPlus, Upload, CheckCircle2 } from 'lucide-react'
import './index.css'



function App() {
  const [items, setItems] = useState([]);
const [itemsLoading, setItemsLoading] = useState(true);
  const [page, setPage] = useState('home')
  const [selected, setSelected] = useState(null)
  const [menu, setMenu] = useState(false)
  const [user, setUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("unifind_user") || "null");
  } catch {
    return null;
  }
});
  const [query, setQuery] = useState('')
const logout = () => {
  localStorage.removeItem("unifind_token");
  localStorage.removeItem("unifind_user");

  setUser(null);
  go("home");
};

const loadItems = async () => {
  setItemsLoading(true);

  try {
    const response = await fetch("http://localhost:5000/api/items");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load items");
    }

    const formattedItems = (data.items || []).map((item) => ({
      id: item.id,
      type: item.report_type === "found" ? "Found" : "Lost",
      name: item.item_name,
      category: item.category || "Other",
      location: item.location,
      date: item.item_date
        ? String(item.item_date).slice(0, 10)
        : "Date not provided",
      description: item.description || "",
      imageUrl: item.image_path
        ? `http://localhost:5000${item.image_path}`
        : null,
      emoji: item.report_type === "found" ? "📦" : "🔎"
    }));

    setItems(formattedItems);
  } catch (error) {
    console.error("Loading items error:", error);
  } finally {
    setItemsLoading(false);
  }
};

useEffect(() => {
  loadItems();
}, []);

  const go = (p) => { setPage(p); setMenu(false); window.scrollTo({top:0, behavior:'smooth'}) }
  const openItem = (item) => { setSelected(item); setPage('details') }

  return <div className="min-h-screen bg-slate-50">
<Navbar
  page={page}
  go={go}
  menu={menu}
  setMenu={setMenu}
  user={user}
  logout={logout}
/>
    {page === 'home' && (
  <Home
    go={go}
    query={query}
    setQuery={setQuery}
    openItem={openItem}
    items={items}
    itemsLoading={itemsLoading}
  />
)}

{page === 'lost' && (
  <ItemsPage
    type="Lost"
    go={go}
    query={query}
    setQuery={setQuery}
    openItem={openItem}
    items={items}
    itemsLoading={itemsLoading}
  />
)}

{page === 'found' && (
  <ItemsPage
    type="Found"
    go={go}
    query={query}
    setQuery={setQuery}
    openItem={openItem}
    items={items}
    itemsLoading={itemsLoading}
  />
)} 
    {page === 'report' && <ReportPage go={go} onReportSubmitted={loadItems}/>} 
    {page === 'details' && <Details item={selected} go={go}/>}
    {page === 'admin' && user?.role === 'admin' && (
      <AdminDashboard items={items} onItemsChanged={loadItems}/>
    )}
    {page === 'admin' && user?.role !== 'admin' && (
      <main className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h1 className="text-2xl font-black">Admin access required</h1>
        <p className="mt-2 text-slate-500">Please login with an administrator account.</p>
        <button onClick={() => go("login")} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">Login</button>
      </main>
    )}
    {page === 'login' && (
  <Auth mode="login" go={go} onLogin={setUser}/>
)}

{page === 'register' && (
  <Auth mode="register" go={go} onLogin={setUser}/>
)}
    <Footer go={go}/>
  </div>
}

function Navbar({page,go,menu,setMenu,user,logout}) { return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
    <button onClick={()=>go('home')} className="flex items-center gap-2 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl text-white">U</span><span><span className="block text-lg font-extrabold tracking-tight">UniFind</span><span className="block text-[11px] text-slate-500">Campus Lost & Found</span></span></button>
    <nav className="hidden items-center gap-7 md:flex">
      <NavLink active={page==='home'} onClick={()=>go('home')}>Home</NavLink><NavLink active={page==='lost'} onClick={()=>go('lost')}>Lost Items</NavLink><NavLink active={page==='found'} onClick={()=>go('found')}>Found Items</NavLink>
      <button onClick={()=>go('report')} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Report Item</button>
      {user?.role === "admin" && (
        <button
          onClick={() => go("admin")}
          className={`text-sm font-semibold ${page === "admin" ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"}`}
        >
          Admin Dashboard
        </button>
      )}
      {user ? (
  <div className="flex items-center gap-3">
    <span className="text-sm font-semibold text-slate-700">
      {user.name}
    </span>

    <button
      onClick={logout}
      className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
    >
      Logout
    </button>
  </div>
) : (
  <button
    onClick={() => go('login')}
    className="text-sm font-semibold text-slate-700 hover:text-indigo-600"
  >
    Login
  </button>
)}
    </nav>
    <button className="rounded-lg p-2 md:hidden" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
  </div>
  {menu && <div className="border-t border-slate-100 bg-white px-5 pb-5 md:hidden"><div className="flex flex-col gap-2 pt-3"><NavLink onClick={()=>go('home')}>Home</NavLink><NavLink onClick={()=>go('lost')}>Lost Items</NavLink><NavLink onClick={()=>go('found')}>Found Items</NavLink>{user?.role === "admin" && <NavLink onClick={()=>go("admin")}>Admin Dashboard</NavLink>}<button onClick={()=>go('report')} className="mt-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">Report Item</button>{user ? <button onClick={logout} className="rounded-xl px-4 py-3 text-left font-semibold text-red-600">Logout</button> : <button onClick={()=>go('login')} className="rounded-xl px-4 py-3 text-left font-semibold">Login</button>}</div></div>}
</header> }
function NavLink({children,onClick,active}) { return <button onClick={onClick} className={`text-sm font-semibold ${active?'text-indigo-600':'text-slate-600 hover:text-indigo-600'}`}>{children}</button> }

function Home({go,query,setQuery,openItem,items,itemsLoading}) { return <main>
  <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white"><div className="mx-auto max-w-6xl px-5 py-20 md:py-28"><div className="max-w-3xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm"><ShieldCheck size={16}/> A safer campus recovery system</div><h1 className="text-4xl font-black tracking-tight md:text-6xl">Lost something? <br/><span className="text-indigo-100">Let's find it.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 md:text-lg">UniFind brings lost and found reports into one organized campus platform so students and staff can search, report, and recover belongings more easily.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={()=>go('lost')} className="rounded-xl bg-white px-5 py-3.5 font-bold text-indigo-700 hover:bg-indigo-50">Browse Lost Items</button><button onClick={()=>go('report')} className="rounded-xl border border-white/40 bg-white/10 px-5 py-3.5 font-bold text-white hover:bg-white/15">Report an Item</button></div></div></div></section>
  <section className="mx-auto max-w-6xl px-5 py-10"><div className="-mt-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:p-5"><div className="flex items-center gap-3"><Search className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search item name, category, or location..." className="w-full bg-transparent py-2 outline-none"/><button onClick={()=>go('found')} className="hidden rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white sm:block">Search</button></div></div></section>
  <section className="mx-auto max-w-6xl px-5 pb-16"><div className="mb-6 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Recent reports</p><h2 className="mt-1 text-2xl font-extrabold">Latest items</h2></div><button onClick={()=>go('found')} className="hidden items-center gap-1 text-sm font-bold text-indigo-600 sm:flex">View all <ArrowRight size={16}/></button></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {itemsLoading ? (
    <p className="col-span-full text-slate-500">Loading items...</p>
  ) : items.length === 0 ? (
    <p className="col-span-full text-slate-500">
      No reports available yet.
    </p>
  ) : (
    items.slice(0, 3).map(x => (
      <ItemCard key={x.id} item={x} open={openItem}/>
    ))
  )}
</div></section>
  <section className="border-y border-slate-200 bg-white"><div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-3"><Feature icon={<PackageSearch/>} title="One place to search" text="Browse structured lost and found reports instead of scattered social posts."/><Feature icon={<ShieldCheck/>} title="Safer claims" text="Claims can be reviewed before an item is marked as returned."/><Feature icon={<PlusCircle/>} title="Easy reporting" text="Submit important item details so others can identify a report."/></div></section>
</main> }
function Feature({icon,title,text}) { return <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</div><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div> }

function ItemsPage({type,go,query,setQuery,openItem,items,itemsLoading}) { const [category,setCategory]=useState('All'); const filtered = useMemo(
  () => items.filter(
    x =>
      x.type === type &&
      (category === 'All' || x.category === category) &&
      `${x.name} ${x.category} ${x.location}`
        .toLowerCase()
        .includes(query.toLowerCase())
  ),
  [items, type, category, query]
); const cats=['All',...new Set(items.filter(x=>x.type===type).map(x=>x.category))]; return <main className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">UniFind directory</p><h1 className="mt-1 text-3xl font-black">{type} Items</h1><p className="mt-2 text-slate-500">Browse {type.toLowerCase()} item reports from the campus.</p></div><button onClick={()=>go('report')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white"><PlusCircle size={18}/> Report Item</button></div><div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row"><div className="flex flex-1 items-center gap-3"><Search size={19} className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." className="w-full outline-none"/></div><select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none">{cats.map(c=><option key={c}>{c}</option>)}</select></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

  {itemsLoading ? (
    <p className="col-span-full text-slate-500">
      Loading items...
    </p>
  ) : (
    <>
      {filtered.map(x => (
        <ItemCard key={x.id} item={x} open={openItem}/>
      ))}

      {filtered.length === 0 && (
        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No matching items found.
        </div>
      )}
    </>
  )}

</div></main> }

function ItemCard({item,open}) { return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-44 items-center justify-center overflow-hidden bg-slate-100">
  {item.imageUrl ? (
    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
  ) : (
    <span className="text-7xl">{item.emoji}</span>
  )}
</div><div className="p-5"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.type==='Found'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{item.type}</span><span className="text-xs text-slate-400">#{String(item.id).padStart(4,'0')}</span></div><h3 className="mt-3 text-lg font-extrabold">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.category}</p><div className="mt-4 space-y-2 text-sm text-slate-500"><p className="flex items-center gap-2"><MapPin size={15}/>{item.location}</p><p className="flex items-center gap-2"><CalendarDays size={15}/>{item.date}</p></div><button onClick={()=>open(item)} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">View Details</button></div></article> }


function AdminDashboard({ items, onItemsChanged }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState("");

  const loadClaims = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("unifind_token");
      if (!token) throw new Error("Please login with your admin account.");

      const response = await fetch("http://localhost:5000/api/admin/claims", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to load claims");
      setClaims(data.claims || []);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const reviewClaim = async (claimId, status) => {
    setActionLoading(claimId);
    setError("");
    setNotice("");
    try {
      const token = localStorage.getItem("unifind_token");
      const response = await fetch(
        `http://localhost:5000/api/admin/claims/${claimId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not update claim");

      setNotice(data.message || `Claim ${status} successfully.`);
      await loadClaims();
      if (onItemsChanged) await onItemsChanged();
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setActionLoading(null);
    }
  };

  const lostCount = items.filter(item => item.type === "Lost").length;
  const foundCount = items.filter(item => item.type === "Found").length;
  const pendingCount = claims.filter(claim => claim.status === "pending").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">UniFind administration</p>
          <h1 className="mt-1 text-3xl font-black">Admin Dashboard</h1>
          <p className="mt-2 text-slate-500">Review submitted claims and monitor campus reports.</p>
        </div>
        <button onClick={() => { loadClaims(); if (onItemsChanged) onItemsChanged(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Refresh Dashboard
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Lost Items</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{lostCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Found Items</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{foundCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Pending Claims</p>
          <p className="mt-2 text-3xl font-black text-indigo-600">{pendingCount}</p>
        </div>
      </div>

      {notice && <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{notice}</p>}
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-extrabold">Claim Requests</h2>
          <p className="mt-1 text-sm text-slate-500">Approve or reject pending claims after reviewing the ownership details.</p>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No claim requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Claim / Item</th>
                  <th className="px-5 py-4">Claimant</th>
                  <th className="px-5 py-4">Ownership Details</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map(claim => (
                  <tr key={claim.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{claim.item_name}</p>
                      <p className="mt-1 text-xs text-slate-400">Claim #{claim.id} · Item #{claim.item_id}</p>
                      <p className="mt-1 text-xs text-slate-500">{claim.location}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">{claim.claimant_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{claim.claimant_email}</p>
                    </td>
                    <td className="max-w-sm whitespace-pre-wrap px-5 py-4 text-slate-600">{claim.message || "No details provided"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        claim.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                        claim.status === "rejected" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{claim.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      {claim.status === "pending" ? (
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={actionLoading === claim.id}
                            onClick={() => reviewClaim(claim.id, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionLoading === claim.id ? "Please wait..." : "Approve"}
                          </button>
                          <button
                            disabled={actionLoading === claim.id}
                            onClick={() => reviewClaim(claim.id, "rejected")}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function ReportPage({ go, onReportSubmitted }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [form, setForm] = useState({
    report_type: "",
    item_name: "",
    category: "",
    item_date: "",
    location: "",
    description: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("unifind_token");

      if (!token) {
        throw new Error("Please login before reporting an item.");
      }

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(
        "http://localhost:5000/api/items",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit report");
      }

      setReportId(data.itemId);

      if (onReportSubmitted) {
        await onReportSubmitted();
      }

      setSubmitted(true);

    } catch (err) {
      setError(err.message || "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20">
        <div className="rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Report submitted!
          </h1>

          <p className="mt-2 text-slate-500">
            Your item report has been successfully saved to the database.
          </p>

          <p className="mt-3 font-bold text-indigo-600">
            Report ID: #{reportId}
          </p>

          <button
            onClick={() => go("home")}
            className="mt-7 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
          Create a report
        </p>

        <h1 className="mt-1 text-3xl font-black">
          Report a Lost or Found Item
        </h1>

        <p className="mt-2 text-slate-500">
          Provide enough information to help the owner identify the item.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">

          <Field label="Report Type">
            <select
              required
              name="report_type"
              value={form.report_type}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select type</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </Field>

          <Field label="Item Name">
            <input
              required
              name="item_name"
              value={form.item_name}
              onChange={handleChange}
              className="input"
              placeholder="e.g. Black Backpack"
            />
          </Field>

          <Field label="Category">
            <select
              required
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select category</option>
              <option>Bag</option>
              <option>ID Card</option>
              <option>Electronics</option>
              <option>Wallet</option>
              <option>Stationery</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Date">
            <input
              required
              type="date"
              name="item_date"
              value={form.item_date}
              onChange={handleChange}
              className="input"
            />
          </Field>
        </div>

        <Field label="Location">
          <input
            required
            name="location"
            value={form.location}
            onChange={handleChange}
            className="input"
            placeholder="Where was it lost/found?"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows="5"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input"
            placeholder="Describe color, size, markings, or other useful information..."
          />
        </Field>

        <Field label="Upload Item Image">
  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
    <div className="flex flex-col items-center gap-3">
      <Upload size={32} className="text-indigo-600" />

      <p className="text-sm font-semibold text-slate-700">
        Choose an image of your item
      </p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file && file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5 MB.");
            e.target.value = "";
            setSelectedImage(null);
            return;
          }

          setSelectedImage(file || null);
        }}
        className="w-full text-sm"
      />

      {selectedImage && (
        <p className="text-sm font-medium text-emerald-600">
          Selected: {selectedImage.name}
        </p>
      )}

      <p className="text-xs text-slate-400">
        JPG, PNG or WEBP — Maximum 5 MB
      </p>
    </div>
  </div>
</Field>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({label,children}){return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>}

function Details({item,go}) {
  const [claimOpen,setClaimOpen] = useState(false)
  const [submittedClaim,setSubmittedClaim] = useState(false)
  const [claimLoading,setClaimLoading] = useState(false)
  const [claimError,setClaimError] = useState("")
  const [form,setForm] = useState({name:'',email:'',proof:'',contact:''})

  if(!item)return <main className="mx-auto max-w-6xl px-5 py-20 text-center"><p>Item not found.</p><button onClick={()=>go('home')} className="mt-4 text-indigo-600">Go home</button></main>

  const handleSubmit = async (event) => {
    event.preventDefault()
    setClaimError("")

    const token = localStorage.getItem("unifind_token")
    if (!token) {
      setClaimError("Please login before submitting a claim.")
      return
    }

    setClaimLoading(true)

    try {
      const message = [
        `Claimant name: ${form.name.trim()}`,
        `Email: ${form.email.trim()}`,
        form.contact.trim() ? `Contact: ${form.contact.trim()}` : null,
        `Proof of ownership: ${form.proof.trim()}`
      ].filter(Boolean).join("\n")

      const response = await fetch("http://localhost:5000/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: item.id,
          message
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit claim")
      }

      setSubmittedClaim(true)
      setClaimOpen(false)
    } catch (error) {
      setClaimError(error.message || "Server connection failed")
    } finally {
      setClaimLoading(false)
    }
  }

  return <main className="mx-auto max-w-5xl px-5 py-12">
    <button onClick={()=>go(item.type.toLowerCase())} className="text-sm font-bold text-indigo-600">← Back to {item.type} Items</button>
    <div className="mt-6 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
      <div className="flex min-h-80 items-center justify-center overflow-hidden bg-slate-100">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full max-h-[520px] w-full object-contain" />
        ) : (
          <span className="text-9xl">{item.emoji}</span>
        )}
      </div>
      <div className="p-7 md:p-10">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.type==='Found'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{item.type} Item</span>
        <h1 className="mt-4 text-3xl font-black">{item.name}</h1>
        <p className="mt-2 text-slate-500">Category: {item.category}</p>
        <div className="mt-7 space-y-4 border-y border-slate-100 py-6 text-sm">
          <p className="flex gap-3"><MapPin className="text-indigo-600" size={19}/><span><b>Location</b><br/>{item.location}</span></p>
          <p className="flex gap-3"><CalendarDays className="text-indigo-600" size={19}/><span><b>Date</b><br/>{item.date}</span></p>
        </div>
        <p className="mt-6 leading-7 text-slate-600">{item.description}</p>
        {item.type === 'Found' ? (
          submittedClaim ? (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={20}/> Claim submitted</div>
              <p className="mt-1 text-sm">Your claim for {item.name} has been saved to the database and is awaiting review.</p>
            </div>
          ) : (
            <button onClick={()=>{
              if (!localStorage.getItem("unifind_token")) {
                go("login")
                return
              }
              setClaimError("")
              setClaimOpen(true)
            }} className="mt-7 w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white hover:bg-indigo-700">Claim This Item</button>
          )
        ) : (
          <p className="mt-7 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">Claims are available for found items only.</p>
        )}
        {claimError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{claimError}</p>}
        {item.type === 'Found' && <p className="mt-3 text-center text-xs text-slate-400">Provide details only the rightful owner would know. Your claim will remain pending until reviewed.</p>}
      </div>
    </div>

    {claimOpen && <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Item claim</p><h2 className="mt-1 text-2xl font-black">Claim {item.name}</h2><p className="mt-2 text-sm text-slate-500">Tell us how we can verify that this item belongs to you.</p></div>
        <button type="button" onClick={()=>setClaimOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Your full name"><input required minLength="2" maxLength="80" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Enter your name"/></Field>
        <Field label="University email"><input required type="email" maxLength="120" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input" placeholder="you@university.edu"/></Field>
        <Field label="Contact number (optional)"><input type="tel" maxLength="30" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} className="input" placeholder="Your phone number"/></Field>
        <Field label="Proof of ownership"><textarea required minLength="15" maxLength="1000" rows="4" value={form.proof} onChange={e=>setForm({...form,proof:e.target.value})} className="input" placeholder="Describe unique marks, contents, stickers, or other details that only the owner would know."/></Field>
        {claimError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{claimError}</p>}
        <button type="submit" disabled={claimLoading} className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{claimLoading ? "Submitting..." : "Submit Claim Request"}</button>
      </form>
      <p className="mt-4 text-xs leading-5 text-slate-400">Your claim details will be saved in the UniFind database and remain pending until reviewed.</p>
    </div>}
  </main>
}

function Auth({ mode, go, onLogin }) {
  const register = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            register
              ? { name, email, password }
              : { email, password }
          )
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (register) {
        setMessage("Registration successful! Please login.");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("unifind_token", data.token);
        localStorage.setItem(
          "unifind_user",
          JSON.stringify(data.user)
        );

      onLogin(data.user);

        setMessage("Login successful!");
        go("home");
      }

    } catch (err) {
      setError(err.message || "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl font-black text-white">
          U
        </div>

        <h1 className="mt-5 text-center text-2xl font-black">
          {register
            ? "Create your UniFind account"
            : "Welcome back"}
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          {register
            ? "Join your campus lost and found community."
            : "Sign in to manage your reports and claims."}
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">

          {register && (
            <Field label="Full Name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@university.edu"
            />
          </Field>

          <Field label="Password">
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Minimum 8 characters"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : register
                ? "Create Account"
                : "Login"}
          </button>

        </form>

        <button
          onClick={() => go(register ? "login" : "register")}
          className="mt-5 w-full text-sm font-semibold text-indigo-600"
        >
          {register
            ? "Already have an account? Login"
            : "New to UniFind? Create an account"}
        </button>

      </div>
    </main>
  );
}


function Footer({go}){return <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 UniFind — Campus Lost & Found</p><div className="flex gap-5"><button onClick={()=>go('lost')} className="hover:text-indigo-600">Lost Items</button><button onClick={()=>go('found')} className="hover:text-indigo-600">Found Items</button><button onClick={()=>go('report')} className="hover:text-indigo-600">Report</button></div></div></footer>}
createRoot(document.getElementById('root')).render(<App />)