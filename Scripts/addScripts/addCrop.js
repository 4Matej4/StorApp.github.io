const historyList = document.getElementById('history_list')
const cropForm = document.getElementById('crop_setter')
const cropN = document.getElementById('crop_name')
const cropdT = document.getElementById('crop_type')
const cropI = document.getElementById('crop_ID')
const deleteAllBtn = document.getElementById('deleteBtn')

let db;
const openDb = window.indexedDB.open('myDatabase', 1)

openDb.onerror = () => {
    console.error("Error opening database");
}


openDb.onsuccess = () =>{
    db = openDb.result;
    console.log("Successfully opened");
    showCrops()
}

openDb.onupgradeneeded = (init) => {
    db = init.target.result;
    console.log("Upgrade fired");
}

cropForm.addEventListener('submit', addCrop);

function addCrop(e) {
    e.preventDefault()

    const newCrop = {
        cropName: cropN.value,
        cropType: cropdT.value,
        cropKod: cropI.value
    }

    const transaction = db.transaction(['crops'], "readwrite"); // vytvorenie transakcie
    const objectStore = transaction.objectStore('crops'); //referencia na objectStore
    const addRequest = objectStore.add(newCrop); //pridanie záznamu

    addRequest.addEventListener('success', () => {
        cropN.value = '';
        cropdT.value = '';
        cropI.value = '';
    })

    transaction.oncomplete = () => {
        console.log("Plodina nahratá");
        showCrops()
    }

    transaction.onerror = (error) => {
        console.log('Transaction error')
    }
}



function showCrops() {
    while (historyList.firstChild) {
        historyList.removeChild(historyList.firstChild);
    }

    const transaction = db.transaction("crops", "readonly")
    const objectStore = transaction.objectStore("crops")
    const request = objectStore.openCursor();

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const listItem = document.createElement('li');
            const p = document.createElement('p');
            const trash = document.createElement('button');

            trash.className = 'record_icon delete'
            listItem.appendChild(p);
            listItem.appendChild(trash)
            listItem.setAttribute('data-id', cursor.value.id)
            historyList.appendChild(listItem)
            p.textContent = `${cursor.value.cropName} | ${cursor.value.cropType} |  ${cursor.value.cropKod}`

            trash.addEventListener('click', deleteItem)
            cursor.continue()
        } else {
            if (!historyList.firstChild) {
                const listItem = document.createElement('li');
                listItem.textContent = 'Doposiaľ neboli nahraté žiadne plodiny.'
                historyList.appendChild(listItem)
            }
        }
    }
}

function deleteItem(event) {
    const cropID = Number(event.target.parentNode.getAttribute('data-id'))
    const listItem = event.target.parentNode
    const transaction = db.transaction(["crops"], 'readwrite');
    const objectStore = transaction.objectStore('crops');

    objectStore.delete(cropID);

    transaction.oncomplete = () => {
        listItem.parentNode.removeChild(listItem);
        if (!historyList.firstChild) {
            const emptylistItem = document.createElement('li');
            listItem.textContent = 'Doposiaľ neboli nahraté žiadne plodiny.'
            historyList.appendChild(emptylistItem);
        }
    }
    transaction.onerror = () => { console.log("erorr") }
}

function deleteAll() {
    const transaction = db.transaction(["crops"], "readwrite")
    const objectStore = transaction.objectStore("crops")
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

deleteAllBtn.addEventListener('click', deleteAll)




const exportBtn = document.getElementById('exportBtn')



function exportToExcel() {
    const rq = indexedDB.open('databse');

    rq.onsuccess = e => {
        const db = e.target.result;

        const transaction = db.transaction('crops');
        const objectStore = transaction.objectStore('crops');

        const rq = objectStore.getAll();

        rq.onsuccess = e => {
            const data = e.target.result;

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            XLSX.writeFile(wb, 'export.xlsx')
        }
    }
}


exportBtn.addEventListener('click', exportToExcel);


