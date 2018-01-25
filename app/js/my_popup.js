$(document).ready(function () {
    $('#input-file').change(handleFileSelect);

});

function handleFileSelect(evt) {
    var file = evt.target.files;
    console.log(file[0].type);
    XLSX.read(file[0]);
}