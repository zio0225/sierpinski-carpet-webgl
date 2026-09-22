const canvas = document.getElementById('canvas');
const depthInput = document.getElementById('depth');
const depthValue = document.getElementById('depth-value');
const colorInput = document.getElementById('color');
const decreaseButton = document.getElementById('decrease');
const increaseButton = document.getElementById('increase');
const gl = canvas.getContext('webgl');

function vec2(x, y) {
  if (y === undefined) y = x;
  return [x || 0, y || 0];
}

function add(u, v) {
  return u.map((value, index) => value + v[index]);
}

function subtract(u, v) {
  return u.map((value, index) => value - v[index]);
}

function scale(s, u) {
  return u.map(value => s * value);
}

function mix(u, v, s) {
  return u.map((value, index) => (1.0 - s) * value + s * v[index]);
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
}

var vertElem = document.getElementById('vertex-shader');
var fragElem = document.getElementById('fragment-shader');
var vertShdr = gl.createShader(gl.VERTEX_SHADER);
var fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(vertShdr, vertElem.text);
gl.shaderSource(fragShdr, fragElem.text);
gl.compileShader(vertShdr);
gl.compileShader(fragShdr);

const program = gl.createProgram();
gl.attachShader(program, vertShdr);
gl.attachShader(program, fragShdr);
gl.linkProgram(program);
gl.useProgram(program);

const buffer = gl.createBuffer();
const position = gl.getAttribLocation(program, 'position');
const color = gl.getUniformLocation(program, 'color');
gl.enableVertexAttribArray(position);
let positions = [];

function addSquare(minimum, maximum) {
  const bottomLeft = mix(minimum, maximum, 0.0);
  const bottomRight = vec2(maximum[0], minimum[1]);
  const topLeft = vec2(minimum[0], maximum[1]);
  const topRight = mix(minimum, maximum, 1.0);
  positions.push(
    bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topLeft[0], topLeft[1],
    topLeft[0], topLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1]
  );
}

function createCarpet(minimum, maximum, level) {
  if (level === 0) {
    addSquare(minimum, maximum);
    return;
  }
  const step = scale(1.0 / 3.0, subtract(maximum, minimum));
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (row === 1 && column === 1) continue;
      const horizontalOffset = scale(column, vec2(step[0], 0));
      const verticalOffset = scale(row, vec2(0, step[1]));
      const offset = add(horizontalOffset, verticalOffset);
      const nextMinimum = add(minimum, offset);
      const nextMaximum = add(nextMinimum, step);
      createCarpet(nextMinimum, nextMaximum, level - 1);
    }
  }
}

function draw() {
  const size = canvas.clientWidth;
  canvas.width = size;
  canvas.height = size;
  gl.viewport(0, 0, size, size);
  gl.uniform3fv(color, hexToRgb(colorInput.value));
  positions = [];
  createCarpet([-1, -1], [1, 1], Number(depthInput.value));
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  depthValue.textContent = depthInput.value;
}

depthInput.addEventListener('input', draw);
colorInput.addEventListener('input', draw);
decreaseButton.addEventListener('click', () => { depthInput.value = Math.max(0, Number(depthInput.value) - 1); draw(); });
increaseButton.addEventListener('click', () => { depthInput.value = Math.min(6, Number(depthInput.value) + 1); draw(); });
window.addEventListener('resize', draw);
draw();
