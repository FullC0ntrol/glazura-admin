const API = "http://localhost:4000";

// 🔑 Logowanie admina
export const login = (user, pass) =>
  fetch(API + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user, pass }),
  }).then((r) => r.json());

// 📂 Lista albumów
export const listAlbums = () =>
  fetch(API + "/api/albums", { credentials: "include" }).then((r) => r.json());

// ➕ Tworzenie nowego albumu
export const createAlbum = (title) =>
  fetch(API + "/api/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  }).then((r) => r.json());

// 🖼️ Wgrywanie zdjęć do albumu
export const uploadPhotos = (files, albumId) => {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("files", f));
  return fetch(API + `/api/albums/${albumId}/photos`, {
    method: "POST",
    credentials: "include",
    body: fd,
  }).then((r) => r.json());
};

// ✏️ Aktualizacja albumu (np. tytuł, lista zdjęć)
export const updateAlbum = (id, data) =>
  fetch(API + `/api/albums/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  }).then((r) => r.json());
