// Construtor para um objeto Shader
// param:
//		gl: constexto do webGL
//		sdr_id: identificador (HTML) do shader
function Shader(gl, sdr_id)
{
	this.id = (function()
	{
		var id;
		var shader = document.getElementById(sdr_id);
		if ( !shader )
			throw Error("{Shader}:: elemento HTML: " + sdr_id + " não foi encontrado");
		
		var shader_type;
		id = gl.createShader(function()
		{
			if ( shader.type === "x-shader/x-vertex" ) {
				shader_type = gl.VERTEX_SHADER;
			} else if ( shader.type === "x-shader/x-fragment" ) {
				shader_type = gl.FRAGMENT_SHADER;
			} else {
				throw Error("{Shader}:: ID = " + sdr_id + ". O tipo " + shader.type + " não é suportado");
			}
			return shader_type;
		}() );
		
		gl.shaderSource(id, shader.innerHTML);
		gl.compileShader(id);
		
		if ( !gl.getShaderParameter(id, gl.COMPILE_STATUS) )
		{
			var msg = "Erro de compilação no " + 
			(function()
			{
				switch(shader_type)
				{
					case gl.VERTEX_SHADER:
						return "SHADER DE VERTEX";
					case gl.FRAGMENT_SHADER:
						return "SHADER DE FRAGMENTO";
					default:
						return "DESCONHECIDO";
				}
			})() + "\n" + gl.getShaderInfoLog(id);
			
			console.log(msg);
			throw Error(msg.replace("\n", "<br>"));
		}
		return id;
	})();
}
	
Shader.prototype.delete = function()
{
	gl.deleteShader(this.id);
	this.id = undefined;
};


// Construtor para o objeto Program
// Param:
//		gl: contexto WebGL
//		vertex: id da tag do vertex
//		fragment: id da tag do fragmento
function Program(gl, vertex, fragment)
{
	this.id = (function()
	{
		var id;
		var vs = new Shader(gl, vertex);
		var fs = new Shader(gl, fragment);
		
		id = gl.createProgram();
		gl.attachShader(id, vs.id);
		gl.attachShader(id, fs.id);
		gl.linkProgram(id);
		
		if ( !gl.getProgramParameter(id, gl.LINK_STATUS) )
		{
			var txt = "Erro de linkagem\n" + gl.getProgramInfoLog(id);
			console.log(txt);
			throw Error(txt.replace("\n", "<br>"));
		}
		
		vs.delete();
		fs.delete();
		
		return id;
	})();
	this.attributes = {};
}

Program.prototype.use = function()
{
	gl.useProgram(this.id);
};
	
Program.prototype.get_locations = function(attributes, uniforms)
{
	var i;
	for (i in attributes)
	{
		this.attributes[attributes[i]] = gl.getAttribLocation(this.id, attributes[i]);
	}
	
	for (i in uniforms)
	{
		this[uniforms[i]] = gl.getUniformLocation(this.id, uniforms[i]);
	}
}
	
Program.prototype.delete = function()
{
	gl.deleteProgram(this.id);
	this.id = undefined;
};


