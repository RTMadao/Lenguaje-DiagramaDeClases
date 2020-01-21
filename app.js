//objetos HTML
var code = document.getElementById("codeArea");
var filas = document.getElementById("idFilas");

//variables
var numberOfLines;
var lines = [];
var linesCode;

//Exprecion regular
const clase = /^Clase: [A-Z][a-zA-Z_]*;$/

//se activa cada que se detecta un cambio en el textarea
//se calcula el numero de final que hay en el texto encontrado en cada uno el salto de linea y contando el numero de saltos encontrados
function codeChange(){
    if(code.value.match(/\n/g) != null) numberOfLines = code.value.match(/\n/g).length + 1;
    else numberOfLines = 1
    enumerarFilas();
}

//enumera las filas de el codigo en el text area tomando el valor de numberOfLines
function enumerarFilas(){
    lines = [];
    for (let f = 0; f < numberOfLines; f++) {
        lines.push(f+1);
    }
    pintarFilas();
}

//pinta los numero de las filas del codigo en el div lateral izquierdo
function pintarFilas() {
    filas.innerHTML = '';
    for (let f = 0; f < lines.length; f++) {
        filas.innerHTML += `<span>${lines[f]}</span><br/>`
    }
}

function analizarCodigo() {
    linesCode = code.value.split('\n');
    console.log(linesCode);
    for (let i = 0; i < linesCode.length; i++) {
        const cadena = linesCode[i];
        if (clase.test(cadena)){
            console.log(`nueva clase ${cadena.split(' ')[1]}`)
        }
        else{
            console.log(`error en la linea ${i+1}`)
        }
    }
}