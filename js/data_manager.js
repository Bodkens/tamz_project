function showFishPage(data){
    const navigator = document.getElementById("navigator");

    navigator.pushPage("edit.html", data)
}
let database;
let records;
document.addEventListener("init", function(ev) {

    let request;
    if(ev.target.id === "main_page"){
       request = window.indexedDB.open("database", 10)

        let pageId = ev.target.id;

        request.onerror = (ev) => {
            ons.notification.alert(`Database error occurred: ${ev.target.error}`);
        };

        request.onupgradeneeded = (ev) => {

            console.log("Database is updating")
            let db = ev.target.result;

            if(!db.objectStoreNames.contains("fishes")){
                console.log("Creating new Store");
                db.createObjectStore("fishes", {keyPath: "id", autoIncrement: true});
            }

            db.deleteObjectStore("fishes");
            let objStore = db.createObjectStore("fishes", {keyPath: "id", autoIncrement: true});

            objStore.clear();

        }

        request.onsuccess = (ev) => {

            console.log("Database is opened")
            database = ev.target.result;

            let fishesStoreTransaction = database.transaction(["fishes"], "readonly")
                .objectStore("fishes");

            if(pageId === "main_page"){

                let list = document.getElementById("fish_list");

                let getAllFishes = fishesStoreTransaction.getAll();

                getAllFishes.onsuccess = (ev) => {

                    records = ev.target.result;

                    list.delegate = {
                        createItemContent: function (i){

                                    if (records.length !== 0){

                                        return ons.createElement(`
                                            
                                            <ons-gesture-detector>
                                            <ons-list-item tappable>
                                                
                                                <div prevent-tap class="left">
                                                <img prevent-tap src="${records[i].image}" alt="logo" width="50" height="50">
                                                </div>
                                                
                                                    <div class="center" id="fish-item">
                                                        <label id="${records[i].id}">${records[i].name}</label>
                                                    </div>
                                                
                                                
                                                
                                            </ons-list-item>     
                                            </ons-gesture-detector>                        
                                            `);

                                    }
                            return ons.createElement(`<label>Add your first fish by button below</label>>`)
                        },
                        countItems: function (){
                            return records.length;
                        }
                    }
                }
            }
        }
    }
});

document.addEventListener('show', function (ev){
    if(ev.target.id === "edit_page"){

        if(ev.target.data.id === undefined){
            document.getElementById("title").textContent = "Add fish";
            document.getElementById("save_button").textContent = "Add fish";
        }
        else {

            document.getElementById("title").textContent = "Edit fish";
            document.getElementById("save_button").textContent = "Edit fish";

            let transaction = database.transaction(["fishes"], "readonly").objectStore("fishes").get(parseInt(ev.target.data.id));

            transaction.onsuccess = () => {
                let obj = transaction.result;
                document.getElementById("name").value = obj.name;
                document.getElementById("description").value = obj.description;
                document.getElementById("image_display").src = obj.image;
                document.getElementById("video_display").src = obj.video;
            }
        }
    }
    if(ev.target.id === "main_page"){
        document.getElementById("fish_list").refresh();
    }
});

function addFish(){


    let page = document.getElementById("edit_page");
    let nameInput = document.getElementById("name");
    let descriptionInput = document.getElementById("description");

    let imageInput = document.getElementById("image_display");
    let videoInput = document.getElementById("video_display");

    if(nameInput.value === "" || descriptionInput.value === "" || imageInput.src === "" || videoInput.src === ""){
        ons.notification.alert("Please fill all data");
        return;
    }


    const objectStore = database.transaction(["fishes"], "readwrite").objectStore("fishes");

    let obj;
    if (page.data.id === undefined){
        obj = {name: nameInput.value,
            description: descriptionInput.value, image: imageInput.src, video: videoInput.src}
    }
    else {
        obj = obj = {name: nameInput.value,
            description: descriptionInput.value, image: imageInput.src, video: videoInput.src, id: parseInt(page.data.id)}
    }
    const objectStoreRequest = objectStore.put(obj);

    objectStoreRequest.onsuccess = () => {

        database.transaction(["fishes"], "readonly").objectStore("fishes").getAll().onsuccess = (req) => {
            records = req.target.result;
            const navigator = document.getElementById("navigator");
            navigator.popPage();
        }
    }

    objectStoreRequest.onerror = () => {
        ons.notification.alert("Something went wrong");
    }

}

document.addEventListener('change', function (ev){

    if((ev.target.id === "image" || ev.target.id === "video") && ev.target.files[0]){
        const reader = new FileReader();



        let loaderId = ev.target.id;

        reader.onloadstart = function (){
            document.getElementById("loading_modal").show();
        }
        reader.onloadend  = function (){
            document.getElementById("loading_modal").hide();
        }
        if(ev.target.files[0]){
            reader.readAsDataURL(ev.target.files[0]);
        }
        reader.onload = function (){

            if(loaderId === "image"){
                const imageDisplay = document.getElementById("image_display");
                imageDisplay.src = reader.result;
            }
            else if(loaderId === "video"){

                const videoDisplay = document.getElementById("video_display");
                videoDisplay.src = reader.result;
            }
        };
    }
});

document.addEventListener('tap', function (ev) {

    if(ev.target.id === "fish-item"){
        const navigator = document.getElementById("navigator");
        navigator.pushPage("display_page.html", { data: {id: ev.target.children[0].id}});
    }
});

document.addEventListener('show', function (ev) {

    if(ev.target.id === "display_page"){


        let transaction = database.transaction(["fishes"], "readonly").objectStore("fishes").get(parseInt(ev.target.data.id));

        transaction.onsuccess = () => {

            let obj = transaction.result;

            document.getElementById("display_title").textContent = obj.name;
            document.getElementById("display_description").textContent = obj.description;
            document.getElementById("display_image").src = obj.image;
            document.getElementById("display_video").src = obj.video;

        }
    }
});

document.addEventListener('hold', function (ev)  {
    if(ev.target.id === "fish-item"){
        showActionSheet(ev.target.children[0].id);
    }
});

function showActionSheet(id){
    ons.openActionSheet({
        cancelable: true,
        buttons: [
            {label: "Edit"},
            {label: "Delete", modifier: "destructive"},
            {label: "Cancel", icon: "md-close"}
        ]
    }).then(function (index) {

        if (index === 0){

            const navigator = document.getElementById("navigator");
            navigator.pushPage("edit.html", { data: {id: id}});

        }
        else if (index === 1){

            database.transaction(["fishes"], "readwrite").objectStore("fishes").delete(parseInt(id)).onsuccess = () => {

                let refresh = database.transaction(["fishes"], "readwrite").objectStore("fishes").getAll();

                refresh.onsuccess = () => {
                    records = refresh.result;
                    document.getElementById("fish_list").refresh();
                }
            }
        }
    });
}
