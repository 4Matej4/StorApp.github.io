const storageForm = document.getElementById('storage_setter')
const NameStorage = document.getElementById('storage_name')
const historyList = document.getElementById('history_list')
const clearBtn = document.getElementById('clearBtn')

let db;

const requestDB = indexedDB.open("myDatabase", 1)

requestDB.onerror = () => {
    console.error("Error opening database");
}

requestDB.onsuccess = () => {
    db = requestDB.result;
    console.log("Successfuly opened");
    showStorages()
}

requestDB.onupgradeneeded = (init) => {
    const db = init.target.result

    console.log("Upgrade fired")
}

storageForm.addEventListener('submit', addStorage)

function addStorage(e) {
    e.preventDefault()

    const newStorage = {
        storageName: NameStorage.value,

    }

    const transaction = db.transaction(['storages'], "readwrite")
    const objectStore = transaction.objectStore("storages")
    const addRequest = objectStore.add(newStorage);

    addRequest.onsuccess = () => {
        NameStorage.value = ''
    }

    transaction.oncomplete = () => {
        console.log("Sklad nahratý");
        showStorages()

    }
    transaction.onerror = () => {
        console.error("Error pri transakcii");
    }
}

function showStorages() {
    while (historyList.firstChild) {
        historyList.removeChild(historyList.firstChild);
    }

    const transaction = db.transaction("storages", "readonly")
    const objectStore = transaction.objectStore("storages")
    const request = objectStore.openCursor();
    
    request.onsuccess = (event) => {
        console.log(event.target.result)
        const cursor = event.target.result;
        if (cursor) {
            const listItem = document.createElement('li')
            const p = document.createElement('p')
            const trashBtn = document.createElement('button')

            listItem.appendChild(p)
            listItem.appendChild(trashBtn)

            listItem.className = "history_list li"
            trashBtn.className = "record_icon delete"


            historyList.appendChild(listItem)

            p.textContent = cursor.value.storageName;

            listItem.setAttribute('data-id', cursor.value.id)

            trashBtn.addEventListener('click', deleteItem);
            cursor.continue()
        } else {
            if (!historyList.firstChild) {
                const listItem = document.createElement('li');
                listItem.textContent = 'Doposiaľ neboli nahraté žiadne záznamy.'
                historyList.appendChild(listItem);
            }
        }
    }
}

function deleteItem(event) {
    const itemID = Number(event.target.parentNode.getAttribute('data-id'))
    const transaction = db.transaction(['storages'], 'readwrite');
    const objectStore = transaction.objectStore('storages');

    objectStore.delete(itemID);

    transaction.oncomplete = () => {
        event.target.parentNode.parentNode.removeChild(event.target.parentNode)
        if (!historyList.firstChild) {
            const listItem = document.createElement('li');
            listItem.textContent = 'Doposiaľ neboli nahraté žiadne záznamy.';
            historyList.appendChild(listItem);
        }
    }

    transaction.onerror = () => console.log("Chyba transakcie pri mazaní záznamu");
}

clearBtn.addEventListener('click', clear)

function clear() {
    const transaction = db.transaction(["storages"], "readwrite")
    const objectStore = transaction.objectStore("storages")
    const deleteRequest = objectStore.clear();

    transaction.oncomplete = () =>{
        console.log("Všetko zmazane");
    }

    transaction.onerror = () =>{
        console.log("Chyba pri celkovom mazaní");
    }

    deleteRequest.onsuccess = () =>{
        console.log("Request mazania úspešný");
    }

    location.reload()
}


