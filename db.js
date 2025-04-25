const dbName = "vacinasDB";
const dbVersion = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = () => reject("Erro ao abrir o banco.");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('vacinas')) {
        db.createObjectStore('vacinas', { keyPath: 'id', autoIncrement: true }); // 👈 aqui chave primária ID
      }
    };
  });
}

async function saveRegistro(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vacinas', 'readwrite');
    const store = tx.objectStore('vacinas');
    const request = store.add(data);
    request.onsuccess = (event) => {
      data.id = event.target.result; // 👈 salvar o ID gerado
      resolve(data);
    };
    request.onerror = (e) => {
      console.error('Erro ao salvar:', e.target.error);
      reject(false);
    };
  });
}

async function getAllRegistros() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vacinas', 'readonly');
    const store = tx.objectStore('vacinas');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject([]);
  });
}

async function updateRegistro(id, data) {
  const db = await openDB();
  const tx = db.transaction('vacinas', 'readwrite');
  const store = tx.objectStore('vacinas');
  data.id = id; // 👈 muito importante! manter o ID
  await store.put(data); // 👈 apenas PUT direto
}

async function deleteRegistro(id) {
  const db = await openDB();
  const tx = db.transaction('vacinas', 'readwrite');
  const store = tx.objectStore('vacinas');
  await store.delete(id);
}
