function lineThroughPoints(point1, point2) {
    // Controlliamo se i due punti sono uguali
    if (point1[0] === point2[0] && point1[1] === point2[1]) {
      return null; // Punti coincidenti, retta indefinita
    }
  
    // Calcoliamo la pendenza (coefficiente angolare)
    const gradient = (point2[1] - point1[1]) / (point2[0] - point1[0]);
  
    // Calcoliamo l'intercetta sull'asse y (termine noto)
    const yIntercept = point1[1] - gradient * point1[0];
  
    // Restituiamo i coefficienti (pendenza, intercettaY)
    return [gradient, yIntercept];
  }
  
  // Esempio di utilizzo
  const point1 = [2, 3];
  const point2 = [5, 7];
  
  const coefficienti = lineThroughPoints(point1, point2);
  console.log("Coefficienti della retta:", coefficienti); // [2.0, 1.0]

  function orthogonalLineByPoint(point, line) {
    // Controlliamo se la retta data è orizzontale
    if (line[0] === 0) {
      return [Infinity, point[1]]; // Retta perpendicolare verticale
    }
  
    // Calcoliamo il coefficiente angolare della retta perpendicolare
    const slope = -1 / line[0];
  
    // Calcoliamo l'intercetta sull'asse y
    const yIntercept = point[1] - slope * point[0];
  
    // Restituiamo i coefficienti (pendenzaPerpendicolare, intercettaY)
    return [slope, yIntercept];
  }
  
  // Esempio di utilizzo
  const punto = [2, 3];
  const rettaData = [1, 2]; // Retta con coefficiente angolare 1
  
  const coefficientiPerpendicolare = orthogonalLineByPoint(punto, rettaData);
  console.log("Coefficienti della retta perpendicolare:", coefficientiPerpendicolare); // [-1, 1]

  function vectorComponents(vector, ax1, ax2) {
    // Controlliamo se i vettori asseX e asseY sono perpendicolari
    const scalarProduct = ax1[0] * ax2[1] - ax1[1] * ax2[0];
    if (scalarProduct === 0) {
      throw new Error("Vettori asseX e asseY non perpendicolari");
    }
  
    // Proiezione del vettore sul primo asse (asseX)
    const projection1 = (vector[0] * ax1[0] + vector[1] * ax1[1]) / (ax1[0] ** 2 + ax1[1] ** 2);
  
    // Proiezione del vettore sul secondo asse (asseY)
    const projection2 = (vector[0] * ax2[0] + vector[1] * ax2[1]) / (ax2[0] ** 2 + ax2[1] ** 2);
  
    // Restituiamo le componenti (componenteX, componenteY)
    return [projection1, projection2];
  }
  
  // Esempio di utilizzo
  const vettore = [3, 4];
  const asseX = [1, 0]; // Asse X (orizzontale)
  const asseY = [0, 1]; // Asse Y (verticale)
  
  const componenti = vectorComponents(vettore, asseX, asseY);
  console.log("Componenti del vettore sugli assi:", componenti); // [3.0, 4.0]

  /**
   * Angle of aline with the cartesian axis X.
   * @param {*} slope slope of the line
   * @returns 
   */
  function angleX(slope) {
    // Controlliamo se la retta è parallela all'asse x
    if (slope === 0) {
      return 0; // Retta parallela all'asse x, angolo 0 gradi
    } else if (slope === Infinity) {
      return toRadiants(90); // Retta perpendicolare all'asse x, angolo 90 gradi
    }
  
    // Calcoliamo l'angolo usando l'arcotangente
    const angoloInRads = Math.atan(slope);
  
 
    return angoloInRads;
  }


/**
 * Tranform coordinates from polar to cartesian
 * @param {*} ray 
 * @param {*} angle angle in radians
 * @returns 
 */  
function polarToCartesian(ray, angle) {
  // Controlliamo se il raggio è negativo
  if (ray < 0) {
    throw new Error("Raggio non valido: deve essere positivo");
  }

  // Calcoliamo la coordinata x
  const x = ray * Math.cos(angle);

  // Calcoliamo la coordinata y
  const y = ray * Math.sin(angle);

  // Restituiamo le coordinate cartesiane (x, y)
  return [x, y];
}
  
// Esempio di utilizzo
const raggio = 5;
const angoloGradi = 30; // Angolo in gradi

const angoloRadianti = toRadiants(angoloGradi);

const coordinateCartesiane = polarToCartesian(raggio, angoloRadianti);
console.log("Coordinate cartesiane:", coordinateCartesiane); // [2.5, 4.33]

function toRadiants(angoloGradi) {
  return angoloGradi * (Math.PI / 180);
}

function line(l,x) {
  return l[0] * x + l[1];
}

function vector_mod(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

const a = [1,1]
const b = [3,2]

const l_a_b = lineThroughPoints(a,b);
console.log(l_a_b);
console.log(line(l_a_b,1));
console.log(line(l_a_b,3));

const l_o = orthogonalLineByPoint([1.5, line(l_a_b,1.5)], l_a_b)
console.log("l_o", l_o);
console.log("l_o(1.5)", line(l_o,1.5));

var angle = angleX(l_a_b[0])
console.log(`angoloConAsseX(${l_a_b[0]}) =`, angle);

var v1 = polarToCartesian(1, angle)
console.log(v1);

var angle = angleX(l_o[0])
console.log(`angoloConAsseX(${l_o[0]}) =`, angle);

var v2 = polarToCartesian(1, angle)
console.log(v2);

const scalarProduct = v1[0] * v2[0] + v1[1] * v2[1];
console.log(`scalar product = ${Math.round(scalarProduct,5)}`)





  
