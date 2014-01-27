// petit server 'web' qui renvoi des données pendant un temps determiné
// auteur: kgersen pour lafibre.info ( https://lafibre.info/profile/kgersen/ )
// pre-requis: node.js ( http://nodejs.org/ )
// usage:
//   url_du_serveur:port (durée de 10 secondes)
// ou url_duserveur:port/duree (durée en parametre (secondes)
// par exemple:
//  http://localhost:8888/20 
// le port est en 'dur' dans le code.



var http = require("http");
var Readable = require('stream').Readable;
var url = require('url');

var buff =  new Buffer(40000); // todo: trouver la 'bonne' valeur (4k c'est trop faible, 40k ca a l'air bien).
buff.fill(0); // la on le rempli de 0s, changer pour ce qu'on veut au besoin
for (var i = 0; i++; i<40000)
{
 buff.writeInt8(i%256,i);
}

console.log ("buffer filled" + buff);
// cette fonction crée un Stream d'une durée de <duration> secondes dont le contenu est <buff> en boucle.
function createTimedReadable(duration)
{
  var EndAt = Date.now() + 1000*duration; // quand doit on s'arreter
	var rs = new Readable();
	rs.EndAt = EndAt;
	rs._read = function (size) {
	  console.log("got read size= "+size);
		if (Date.now() < rs.EndAt)
    	rs.push(buff);
    else
    	rs.push(null);
  }
  return(rs);
}

// fonction qui traite chaque requete client
function onHTTPrequest(request, response) {
	var who = request.connection.remoteAddress + ":" + request.connection.remotePort;
  console.log("Request received from " + who);
  var url_parts = url.parse(request.url, true); // on prend l'url et on extrait le path
  var pathname = url_parts.pathname;
  var duration; // duree
  // s'il y a un parametre alors c'est la durée souhaitée
  if (pathname != '/')
  {
  	duration = parseInt(pathname.slice(1));
  	if (duration != NaN)
  	{
  		console.log("got a valid duration parameter: "+duration);
  	}
  	else
  	{
  		// c'est pas un nombre, on met la durée par défaut
  		duration = 10;
  	}
  }
  // on envoi l'entete de la reponse
	response.writeHead(200,
	{
  	'Content-Type'  : 'octet-stream',
  	'Cache-Control' : 'no-cache, no-transform'
  });

  // on 'pipe' le contenu sur un stream de durée <duration>
	var timedReadable = createTimedReadable(duration);
  timedReadable.pipe(response);
}

// on lance le serveur
http.createServer(onHTTPrequest).listen(8888);
console.log("Server has started");
