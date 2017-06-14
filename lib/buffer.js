function Array_Buffer(gl, points)
{
	this.stride = 0;
	
	// attribute_offset especifica os offsets de cada atributo, se existir
	this.attribute_offset = [0];
	
	this.vbo = (function() 
	{
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
		return vbo;
	})();
	
	this.bind = function(program)
	{
		if ( !program )
			throw Error("A função bind necessita do argumento programa");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		
		var i, j = 0;
		for (i in program.attributes)
		{
			if (j >= this.attribute_offset.length) throw Error("Erro entre a quantidade de atributos no programa e no Array Buffer");
			gl.enableVertexAttribArray(program.attributes[i]);
			gl.vertexAttribPointer(program.attributes[i], 3, gl.FLOAT, false, this.stride, this.attribute_offset[j]);
			j++;
		}
	};
}

function Element_Buffer(gl, points)
{
	this.length = points.length,
	this.ibo = (function()
	{
		var ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(points), gl.STATIC_DRAW);
		return ibo;
	})();
	
	this.bind = function()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
	};
}
