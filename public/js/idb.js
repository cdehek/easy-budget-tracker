// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker and set it to version 1
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;

  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadTransaction()
  if (navigator.onLine) {
    uploadRecord();
  }
};

request.onerror = function (event) {
  //log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  //access the object stor for 'new_transaction'
  const recordObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  try {
    recordObjectStore.add(record);
  } catch (error) {
    console.log(error);
  }
}

function uploadRecord() {
  // open transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  //access object store
  const recordObjectStore = transaction.objectStore("new_transaction");

  //get all records from store and set to a variable
  const getAll = recordObjectStore.getAll();

  //upon a successfull .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDB's store, sed it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new_transaction object store
          const recordObjectStore = transaction.objectStore("new_transaction");
          // clear all items in your store
          recordObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
};

// listen for when app comes back online
window.addEventListener('online', uploadRecord);