// Precisa da biblioteca glMatrix

// Os objetos Geometry permite a especificação básica de pontos, faces
// e arestas

function Geometry()
{
	this.vertex = [];
	this.faces = [];
	this.edges = [];
};
	
Geometry.prototype.add_vertex = function(x, y, z)
{
	if ( x instanceof Array)
		this.vertex.push(x);
	else
		this.vertex.push([x, y, z]);
}
	
Geometry.prototype.add_face = function(v0, v1, v2)
{
	this.faces.push([v0, v1, v2]);
}
	
Geometry.prototype.add_edge = function(v0, v1)
{
	this.edges.push([v0, v1]);
}

Geometry.prototype.add_face_to_edge = function(f)
{
	var face = this.faces[f];
	this.add_edge(face[0], face[1]);
	this.add_edge(face[1], face[2]);
	this.add_edge(face[2], face[0]);
}

Geometry.prototype.shift_indices_by = function(amount)
{
	for(var i = 0; i < this.faces.length; i++) {
		var face = this.faces[i];
		for (var j = 0; j < 3; j++)
			face[j] += amount;
	}
	for (var i = 0; i < this.edges.length; i++) {
		this.edges[i][0] += amount;
		this.edges[i][1] += amount;
	}
}

Geometry.prototype.flatten_array = function(type)
{
	if ( type === this.vertex )
		return [].concat.apply([], this.vertex);
	else if ( type === this.faces )
		return [].concat.apply([], this.faces);
	else
		return [].concat.apply([], this.edges);
}

Geometry.prototype.mid_point = function(v0, v1)
{
	var tmp = [];
	for (var i = 0; i < 3; i++)
		tmp[i] = (this.vertex[v1][i] + this.vertex[v0][i])/2;
	return tmp;
}

Geometry.prototype.round_XY = function(minimum_radius)
{
	for (var i = 0; i < this.vertex.length; i++) {
		var vertex = this.vertex[i];
		var modulus = Math.sqrt(vertex[0]*vertex[0] + vertex[1]*vertex[1]);
		if ( modulus < 0.0000000001 ) continue;
		var steps = Math.round(modulus / minimum_radius);
		var k = steps * minimum_radius / modulus;
		vertex[0] *= k;
		vertex[1] *= k;
	}
}

// Um dos motivos para se usar o gl.UNSIGNED_SHORT é que na variável
// dictionary, a chave é de 32 bits, composta de dois UNSIGNED_SHORT
// para se ter mais índices, é preciso altera a forma de construir
// este dictionary
Geometry.prototype.subdivide = function()
{
	var dictionary = [];
	var o = new Geometry();
	var count = 0;
	
	var insert_vertex = function(object, v0, v1)
	{
		var index = 0;
		if ( v1 == undefined ) {
			index = v0;
		} else {
			index = Math.max(v0,v1) << 16 | Math.min(v0, v1);
		}
		for (var i = 0; i < dictionary.length; i++) {
			if ( dictionary[i].index == index )
				return dictionary[i].value;
		}
		if ( v1 == undefined ) {
			o.add_vertex(object.vertex[v0]);
		} else {
			o.add_vertex(object.mid_point(v0, v1));
		}
		dictionary.push({index: index, value: count});
		return count++;
	}

	for(var i = 0; i < this.faces.length; i++) {
		var face = this.faces[i];
		
		node = [];
		node[0] = insert_vertex(this, face[0]);
		node[1] = insert_vertex(this, face[0], face[1]);
		node[2] = insert_vertex(this, face[1]);
		node[3] = insert_vertex(this, face[2], face[0]);
		node[4] = insert_vertex(this, face[1], face[2]);
		node[5] = insert_vertex(this, face[2]);
		
		o.add_face(node[0], node[1], node[3]);
		o.add_face(node[3], node[1], node[4]);
		o.add_face(node[1], node[2], node[4]);
		o.add_face(node[3], node[4], node[5]);
		
		k = i * 4;
		o.add_face_to_edge(k + 0);
		o.add_face_to_edge(k + 1);
		o.add_face_to_edge(k + 2);
		o.add_face_to_edge(k + 3);
	}
	this.vertex = o.vertex;
	this.faces = o.faces;
	this.edges = o.edges
}


// Os objetos Shape permite a construção de formas simples, individuais

function Shape()
{
	this.geometry = new Geometry();
}

Shape.prototype.vertex = function()
{
	return this.geometry.flatten_array(this.geometry.vertex);
}

Shape.prototype.triangles = function()
{
	return this.geometry.flatten_array(this.geometry.faces);
}
	
Shape.prototype.lines = function()
{
	return this.geometry.flatten_array(this.geometry.edges);
}

var inherit = function(child, parent)
{
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
}

function Plane(subdivisions, z)
{
	Shape.call(this);
	
	if ( z === undefined )
		z = 0;
	
	this.geometry.add_vertex(0, 0, z);
	this.geometry.add_vertex(-1, -1, z);
	this.geometry.add_vertex(1, -1, z);
	this.geometry.add_vertex(-1, 1, z);
	this.geometry.add_vertex(1, 1, z);

	this.geometry.add_face(0, 1, 2);
	this.geometry.add_face(0, 2, 4);
	this.geometry.add_face(0, 4, 3);
	this.geometry.add_face(0, 3, 1);
	
	this.geometry.add_face_to_edge(0);
	this.geometry.add_face_to_edge(1);
	this.geometry.add_face_to_edge(2);
	this.geometry.add_face_to_edge(3);

	this.divide(subdivisions);
}
inherit(Plane, Shape);
Plane.prototype.divide = function(subdivisions)
{
	if ( subdivisions == undefined )
		subdivisions = 0;
	for (var i = 0; i < subdivisions; i++) {
		this.geometry.subdivide();
	}
}

function Hollow_Pyramid(subdivisions)
{
	Plane.call(this, 0, -1);
	this.geometry.vertex[0] = [0, 0, 2];

	this.divide(subdivisions)
}
inherit(Hollow_Pyramid, Plane);

function Cube(subdivisions)
{
	var add = function(from, to, matrix, amount)
	{
		for(var i = 0; i < from.geometry.vertex.length; i++) {
			vec3.transformMat4(from.geometry.vertex[i], from.geometry.vertex[i], matrix);
		}
		from.geometry.shift_indices_by(amount);
		to.geometry.vertex = to.geometry.vertex.concat(from.geometry.vertex);
		to.geometry.faces = to.geometry.faces.concat(from.geometry.faces);
		to.geometry.edges = to.geometry.edges.concat(from.geometry.edges);
	}
	
	
	Plane.call(this, subdivisions, 1);

	var amount = this.geometry.vertex.length;
	
	var rot = mat4.create();

	// right
	mat4.rotateY(rot, rot, glMatrix.toRadian(90));
	add(new Plane(subdivisions, 1), this, rot, amount);

 	// back
	mat4.rotateY(rot, rot, glMatrix.toRadian(90));
	add(new Plane(subdivisions, 1), this, rot, 2 * amount);

	// left
	mat4.rotateY(rot, rot, glMatrix.toRadian(90));
	add(new Plane(subdivisions, 1), this, rot, 3 * amount);
	
	// botton
	mat4.identity(rot);
	mat4.rotateX(rot, rot, glMatrix.toRadian(90));
	add(new Plane(subdivisions, 1), this, rot, 4 * amount);

	// top
	mat4.rotateX(rot, rot, glMatrix.toRadian(180));
	add(new Plane(subdivisions, 1), this, rot, 5 * amount);
}
inherit(Cube, Plane);

function Disk(subdivisions, z)
{
	Shape.call(this, 0);
		
	if ( z === undefined )
		z = 0;
	var n = Math.sqrt(2)/2;
	this.geometry.add_vertex(0, 0, z);
	this.geometry.add_vertex(-1, 0, z);
	this.geometry.add_vertex(-n, -n, z);
	this.geometry.add_vertex(0, -1, z);
	this.geometry.add_vertex(n, -n, z);
	this.geometry.add_vertex(1, 0, z);
	this.geometry.add_vertex(n, n, z);
	this.geometry.add_vertex(0, 1, z);
	this.geometry.add_vertex(-n, n, z);

	this.geometry.add_face(0, 1, 2);
	this.geometry.add_face(0, 2, 3);
	this.geometry.add_face(0, 3, 4);
	this.geometry.add_face(0, 4, 5);
	this.geometry.add_face(0, 5, 6);
	this.geometry.add_face(0, 6, 7);
	this.geometry.add_face(0, 7, 8);
	this.geometry.add_face(0, 8, 1);
	
	this.geometry.add_face_to_edge(0);
	this.geometry.add_face_to_edge(1);
	this.geometry.add_face_to_edge(2);
	this.geometry.add_face_to_edge(3);
	this.geometry.add_face_to_edge(4);
	this.geometry.add_face_to_edge(5);
	this.geometry.add_face_to_edge(6);
	this.geometry.add_face_to_edge(7);

	this.divide(subdivisions)
}
inherit(Disk, Shape);
Disk.prototype.divide = function(subdivisions)
{
	this.geometry.round_XY(1);
	if ( subdivisions == undefined )
		subdivisions = 0;
	for (var i = 0; i < subdivisions; i++) {
		this.geometry.subdivide();
		this.geometry.round_XY(1/Math.pow(2, i + 1));
	}
}

function Hollow_Cone(subdivisions)
{
	Disk.call(this, 0, -1);
	this.geometry.vertex[0] = [0, 0, 1];
	
	this.divide(subdivisions)
}
inherit(Hollow_Cone, Disk);

function Hollow_Cylinder(subdivisions)
{
	Shape.call(this);
	
	this.geometry.add_vertex(-1, 0, 1);
	this.geometry.add_vertex( 0,-1, 1);
	this.geometry.add_vertex( 1, 0, 1);
	this.geometry.add_vertex( 0, 1, 1);
	this.geometry.add_vertex(-1, 0,-1);
	this.geometry.add_vertex( 0,-1,-1);
	this.geometry.add_vertex( 1, 0,-1);
	this.geometry.add_vertex( 0, 1,-1);
	
	this.geometry.add_face(0, 4, 5);
	this.geometry.add_face(5, 1, 0);
	this.geometry.add_face(1, 5, 6);
	this.geometry.add_face(6, 2, 1);
	this.geometry.add_face(2, 6, 7);
	this.geometry.add_face(7, 3, 2);
	this.geometry.add_face(3, 7, 4);
	this.geometry.add_face(4, 0, 3);

	this.geometry.add_face_to_edge(0);
	this.geometry.add_face_to_edge(1);
	this.geometry.add_face_to_edge(2);
	this.geometry.add_face_to_edge(3);
	this.geometry.add_face_to_edge(4);
	this.geometry.add_face_to_edge(5);
	this.geometry.add_face_to_edge(6);
	this.geometry.add_face_to_edge(7);
	
	for (var i = 0; i < subdivisions; i++) {
		this.geometry.subdivide();
		for (var j = 0; j < this.geometry.vertex.length; j++) {
			var v = this.geometry.vertex[j];
			var modulus = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
			v[0] /= modulus;
			v[1] /= modulus;
		}
	}
}
inherit(Hollow_Cylinder, Shape);

function Sphere(subdivisions)
{
	Shape.call(this);
	
	this.geometry.add_vertex( 0, 0, 1);
	this.geometry.add_vertex(-1, 0, 0);
	this.geometry.add_vertex( 0,-1, 0);
	this.geometry.add_vertex( 1, 0, 0);
	this.geometry.add_vertex( 0, 1, 0);
	this.geometry.add_vertex( 0, 0,-1);
	
	this.geometry.add_face(0, 1, 2);
	this.geometry.add_face(0, 2, 3);
	this.geometry.add_face(0, 3, 4);
	this.geometry.add_face(0, 4, 1);
	this.geometry.add_face(5, 1, 4);
	this.geometry.add_face(5, 4, 3);
	this.geometry.add_face(5, 3, 2);
	this.geometry.add_face(5, 2, 1);

	this.geometry.add_face_to_edge(0);
	this.geometry.add_face_to_edge(1);
	this.geometry.add_face_to_edge(2);
	this.geometry.add_face_to_edge(3);
	this.geometry.add_face_to_edge(4);
	this.geometry.add_face_to_edge(5);
	this.geometry.add_face_to_edge(6);
	this.geometry.add_face_to_edge(7);

	for (var i = 0; i < subdivisions; i++) {
		this.geometry.subdivide();
		for (var j = 0; j < this.geometry.vertex.length; j++) {
			var v = this.geometry.vertex[j];
			var modulus = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
			v[0] /= modulus;
			v[1] /= modulus;
			v[2] /= modulus;
		}
	}
}
inherit(Sphere, Shape);

function Draw_Properties()
{
	return {
		triangles: {
			offset: 0,
			length: 0
		},
		lines: {
			offset: 0,
			length: 0
		}
	};
}


// O objeto primitive permite a agregação da formas anteriores em um único buffer
// Lida diretamente com a capacidade de desenhar formas sólidas ou em wireframe

var primitive = {
	gl: null,
	vbo : null,
	triangles: null,
	lines: null,
	
	plane: null,
	hollow_pyramid: null,
	cube: null,
	disk: null,
	hollow_cone: null,
	hollow_cylinder: null,
	sphere: null
};

primitive.init = function(gl, subdivisions)
{
	this.gl = gl;
	var geometry = {
		vertex: [],
		triangles: [],
		lines: []
	};
	var v = [], t = [], l = [];
	var objects = {
		plane : [Plane, "plane"], 
		hollow_pyramid: [Hollow_Pyramid, "hollow_pyramid"],
		cube: [Cube, "cube"],
		disk: [Disk, "disk"],
		hollow_cone: [Hollow_Cone, "hollow_cone"],
		hollow_cylinder: [Hollow_Cylinder, "hollow_cylinder"],
		sphere: [Sphere, "sphere"]
	}; 
	
	var ver_offset = 0, tri_offset = 0, len_offset = 0;
	for (var i in objects) {
		var shape = new objects[i][0](subdivisions);
		shape.geometry.shift_indices_by(ver_offset)
		v = shape.vertex();
		t = shape.triangles();
		l = shape.lines();
	
		this[objects[i][1]] = new Draw_Properties();
		this[objects[i][1]].triangles.offset = tri_offset;
		this[objects[i][1]].triangles.length = t.length;
		this[objects[i][1]].lines.offset = len_offset;
		this[objects[i][1]].lines.length = l.length;
	
		geometry.vertex = geometry.vertex.concat(v);
		geometry.triangles = geometry.triangles.concat(t);
		geometry.lines = geometry.lines.concat(l);
		
		ver_offset += shape.geometry.vertex.length;
		tri_offset += t.length;
		len_offset += l.length;
	}

	this.vbo = new Array_Buffer(gl, geometry.vertex);
// 	this.vbo.stride = o.stride;			////////////////////////////////////////////////////////
 	this.vbo.attribute_map = {pos: 0}; //o.points_offset}; ///////////////////////////////////////////////////
	
	this.triangles = new Element_Buffer(gl, geometry.triangles);
	this.lines = new Element_Buffer(gl, geometry.lines);
}

primitive.bind = function(program)
{
	this.vbo.bind(program);
}

primitive.solid = function(draw_properties)
{
	this.triangles.bind();
	this.gl.drawElements(gl.TRIANGLES, draw_properties.triangles.length, gl.UNSIGNED_SHORT, draw_properties.triangles.offset * 2);
}

primitive.wireframe = function(draw_properties)
{
	this.lines.bind();
	this.gl.drawElements(gl.LINES, draw_properties.lines.length, gl.UNSIGNED_SHORT, draw_properties.lines.offset * 2);
}
