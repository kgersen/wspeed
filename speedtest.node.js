// petit server 'web' qui renvoi des données pendant un temps determiné
// auteur: kgersen pour lafibre.info ( https://lafibre.info/profile/kgersen/ )
// pre-requis: node.js ( http://nodejs.org/ )
// usage:
//   url_du_serveur:port (durée de 10 secondes)
// ou url_duserveur:port/duree (durée en parametre (secondes)
// par exemple:
//  http://localhost:8888/20 

// Parametres du script. todo: les recuperer en parametres de ligne de commande
const PORT = 8888
const DEFAULT_DURATION = 10
const MAX_DURATION = 600
const BUFFSIZE = 16384

// version de Node
console.log('Using Node version ' + process.version);
// correction bug du tick
process.maxTickDepth = Infinity;

// dependencies
var http = require("http");
var Readable = require('stream').Readable;
var url = require('url');

var buff =  new Buffer(BUFFSIZE);
for (var i = 0; i++; i<BUFFSIZE)
{
	buff[i] = i%256;
}
var buffsize = BUFFSIZE;

console.log ("Buffer size is " + buffsize);
// cette fonction crée un Stream d'une durée de <duration> secondes dont le contenu est <buff> en boucle.
function createTimedReadable(duration,who)
{

	var rs = new Readable();

	rs.duration =  duration;
	rs.EndDate = new Date().getTime() + 1000*duration; // quand doit on s'arreter
	rs.LastSize = 0;
	rs.CallCount = 0;
	rs.PushCount = 0;
	rs.TotalBytes = 0;

	rs._read = function (size) {
	  if (rs.LastSize != size)
		{
			console.log(who + " read size= "+size);
			rs.LastSize = size;
			if (size > buffsize)
				console.log(who + " WARNING will starve - buffer too small");
		}
		rs.CallCount++;
		var bDontStop = (new Date().getTime()) < rs.EndDate;
		var bPushMore = true;
		while (bPushMore && bDontStop)
		{
			bPushMore = rs.push(buff);
			rs.TotalBytes += buffsize;
			rs.PushCount++;
			bDontStop = (new Date().getTime()) < rs.EndDate;
		}
		if (!bDontStop)
		{
			console.log(who + " has ended - called "+rs.CallCount+" times, and " + rs.PushCount + " loops. " + rs.TotalBytes +" bytes in " + rs.duration + " second(s)");
			console.log(who + " speed = " + (rs.TotalBytes/(1024*1024)/rs.duration) + " MB/s");
			rs.push(null);
		}
	}
  return(rs);
}

// fonction qui traite chaque requete client
function onHTTPrequest(request, response) {
	var who = request.connection.remoteAddress + ":" + request.connection.remotePort;
  console.log("Request received from " + who);
  var url_parts = url.parse(request.url, true); // on prend l'url et on extrait le path
  var pathname = url_parts.pathname;
  var duration = DEFAULT_DURATION; // duree
  // s'il y a un parametre alors c'est la durée souhaitée
  if (pathname != '/')
  {
  	duration = parseInt(pathname.slice(1));
  	if (duration != NaN)
  	{
  		console.log(who + " got a valid duration parameter: "+duration);
  	}
  	else
  	{
  		// c'est pas un nombre, on met la durée par défaut
  		duration = DEFAULT_DURATION;
  	}
  }
  
  // garde fou sur la valeur de la durée
	if ((duration < 1)||(duration>MAX_DURATION))
		duration = DEFAULT_DURATION;
  

  // on envoi l'entete de la reponse
	response.writeHead(200,
	{
  	'Content-Type'  : 'octet-stream',
  	'Cache-Control' : 'no-cache, no-transform'
  });

  // on 'pipe' le contenu sur un stream de durée <duration>
	var timedReadable = createTimedReadable(duration,who);
  timedReadable.pipe(response);
}

// on lance le serveur
http.createServer(onHTTPrequest).listen(PORT);
console.log("Server has started");
