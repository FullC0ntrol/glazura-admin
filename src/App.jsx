import { useState, useEffect, useRef } from "react";
import {
  login,
  listAlbums,
  createAlbum,
  uploadPhotos,
  updateAlbum,
} from "./api";

const API = "http://localhost:4000";

/* --------------------------- TOAST --------------------------- */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed top-4 right-4 px-4 py-2 bg-black/80 text-white rounded-lg shadow-lg z-50">
      {msg}
    </div>
  );
}

/* --------------------------- UPLOADER --------------------------- */
function Uploader({ onFiles }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-6 text-center transition 
      ${drag ? "border-sky-400 bg-sky-400/10" : "border-white/20 bg-white/5"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <p className="text-white/80">
        Przeciągnij zdjęcia tutaj lub{" "}
        <button
          onClick={() => inputRef.current?.click()}
          className="text-sky-300 underline underline-offset-2"
        >
          wybierz pliki
        </button>
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

/* --------------------------- MODAL NOWEJ REALIZACJI --------------------------- */
function NewAlbumModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  if (!open) return null;

  const handleCreate = async () => {
    if (!title.trim()) return;
    await onCreate(title.trim());
    setTitle("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 grid place-items-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-lg text-white mb-4 font-semibold">
          Nowa realizacja
        </h2>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="np. Łazienka – Warszawa"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
          >
            Anuluj
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold"
          >
            Utwórz
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- GŁÓWNA APLIKACJA --------------------------- */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  /* --------------------------- LOGOWANIE --------------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    const user = e.target.user.value;
    const pass = e.target.pass.value;
    const result = await login(user, pass);
    if (result.ok) {
      setAuthed(true);
      setToast("Zalogowano pomyślnie");
    } else {
      setToast("Błędne dane logowania");
    }
  };

  /* --------------------------- POBIERANIE ALBUMÓW --------------------------- */
  useEffect(() => {
    if (authed) listAlbums().then(setAlbums);
  }, [authed]);

  /* --------------------------- NOWA REALIZACJA --------------------------- */
  const handleCreate = async (title) => {
    const newAlbum = await createAlbum(title);
    setAlbums((prev) => [newAlbum, ...prev]);
    setCurrent(newAlbum);
    setToast("Nowa realizacja utworzona");
  };

  /* --------------------------- DODAWANIE ZDJĘĆ --------------------------- */
  const addPhotos = async (files) => {
    if (!current) return;
    const uploaded = await uploadPhotos(files, current.id);
    setCurrent((c) => ({ ...c, images: [...c.images, ...uploaded] }));
    setAlbums((a) =>
      a.map((al) =>
        al.id === current.id ? { ...al, images: [...al.images, ...uploaded] } : al
      )
    );
    setToast(`Dodano ${uploaded.length} zdjęć`);
  };

  /* --------------------------- USUWANIE ZDJĘCIA --------------------------- */
  const removePhoto = async (id) => {
    if (!current) return;
    // backendowy endpoint DELETE /api/photos/:id (dodaj w serwerze)
    await fetch(`${API}/api/photos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setCurrent((c) => ({
      ...c,
      images: c.images.filter((img) => img.id !== id),
    }));
    setAlbums((a) =>
      a.map((al) =>
        al.id === current.id
          ? { ...al, images: al.images.filter((img) => img.id !== id) }
          : al
      )
    );
    setToast("Usunięto zdjęcie");
  };

  /* --------------------------- USUWANIE ALBUMU --------------------------- */
  const deleteAlbum = async () => {
    if (!current) return;
    if (!confirm("Na pewno chcesz usunąć tę realizację?")) return;
    await fetch(`${API}/api/albums/${current.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setAlbums((a) => a.filter((al) => al.id !== current.id));
    setCurrent(null);
    setToast("Usunięto realizację");
  };

  /* --------------------------- ZAPISYWANIE --------------------------- */
  const saveAlbum = async (publish = false) => {
    if (!current) return;
    setSaving(true);
    const updated = await updateAlbum(current.id, {
      title: current.title,
      published: publish ? true : current.published || false,
    });
    setAlbums((a) => a.map((al) => (al.id === current.id ? updated : al)));
    setCurrent(updated);
    setSaving(false);
    setToast(publish ? "Opublikowano" : "Zapisano zmiany");
  };

  /* --------------------------- WIDOK LOGOWANIA --------------------------- */
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center">
        <form
          onSubmit={handleLogin}
          className="bg-white/5 border border-white/10 p-6 rounded-xl shadow-2xl w-full max-w-sm space-y-4"
        >
          <h1 className="text-center text-2xl text-white font-bold mb-4">
            Panel admina
          </h1>
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Użytkownik
            </label>
            <input
              name="user"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-sky-400 outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Hasło</label>
            <input
              type="password"
              name="pass"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-sky-400 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-lg">
            Zaloguj
          </button>
        </form>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </div>
    );
  }

  /* --------------------------- LISTA REALIZACJI --------------------------- */
  if (!current) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Realizacje</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2"
            >
              <span>+</span> Nowa realizacja
            </button>
          </header>

          {albums.length === 0 ? (
            <p className="text-center text-white/60">
              Nie dodano jeszcze żadnych realizacji.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {albums.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setCurrent(a)}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
                >
                  <h3 className="font-semibold mb-2">{a.title}</h3>
                  <p className="text-sm text-white/60">
                    {a.images?.length || 0} zdjęć
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      a.published
                        ? "text-emerald-400"
                        : "text-amber-400 italic"
                    }`}
                  >
                    {a.published ? "Opublikowano" : "Szkic"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <NewAlbumModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />

        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </div>
    );
  }

  /* --------------------------- WIDOK EDYCJI REALIZACJI --------------------------- */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <button
            onClick={() => setCurrent(null)}
            className="text-white/70 hover:text-white"
          >
            ← Powrót
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={deleteAlbum}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-semibold"
            >
              Usuń realizację
            </button>
            <button
              disabled={saving}
              onClick={() => saveAlbum(false)}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/15"
            >
              {saving ? "Zapisywanie..." : "Zapisz szkic"}
            </button>
            <button
              disabled={saving}
              onClick={() => saveAlbum(true)}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-white font-semibold"
            >
              {saving ? "Publikuję..." : "Opublikuj"}
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <input
            value={current.title}
            onChange={(e) =>
              setCurrent((c) => ({ ...c, title: e.target.value }))
            }
            className="text-2xl font-bold bg-transparent border-b border-white/20 w-full outline-none pb-2"
            placeholder="Tytuł realizacji..."
          />

          <Uploader onFiles={addPhotos} />

          {current.images?.length > 0 ? (
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {current.images.map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 group"
                >
                  <img
                    src={`${API}${img.thumbUrl}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(img.id)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Usuń zdjęcie"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70">Brak zdjęć w tej realizacji.</p>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}
