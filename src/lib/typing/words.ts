import type { TypingLanguage } from './config';

/**
 * Common words, lowercase. The Spanish list avoids words that need an accent
 * (they need dead keys on most layouts) but keeps ñ, which has its own key.
 */

const EN = `the be of and a to in he have it that for they with as not on she at by this we you do but from or which
one would all will there say who make when can more if no man out other so what time up go about than into could state
only new year some take come these know see use get like then first any work now may such give over think most even find
day also after way many must look before great back through long where much should well people down own just because good
each those feel seem how high too place little world very still nation hand old life tell write become here show house both
between need mean call develop under last right move thing general school never same another begin while number part turn
real leave might want point form off child few small since against ask late home interest large person end open public
follow during present without again hold govern around possible head consider word program problem however lead system set
order eye plan run keep face fact group play stand increase early course change help line city put close case force meet
once water upon war build hear light unite live every country bring center let side try provide continue name certain power
pay result question study woman member until far night always service away report something company week church toward start
social room figure nature though young less enough almost read include president nothing yet better big boy cost business
value second why clear expect family complete act sense mind experience art next near direct car law industry important girl
god several matter usual rather per often kind among white reason action return foot care simple within love human along
appear doctor believe speak active student month drive concern best door hope example inform body ever least probable
understand reach effect different idea whole control condition field pass fall note special talk particular today measure
walk teach low hour type carry rate remain full street easy although record sit determine level local sure receive thus
moment spirit train college religion perhaps music grow free cause serve age book board recent sound office cut step class
true history position above strong friend necessary add court deal tax support party whether either land material happen
education death agree arm mother across quite anything town past view society manage answer break organize half fire lose
money stop actual already effort wait department able political learn voice air together shall cover common subject draw
short wife treat limit road letter color behind produce send term total university rise century success minute remember
purchase test fight watch land key board switch press type quick brown fox`.split(/\s+/);

const ES = `de la que el en y a los se del las un por con no una su para es al lo como mas pero sus le ya o este si porque
esta entre cuando muy sin sobre ser tiene hay donde desde todo nos durante todos uno les ni contra otros ese eso ante ellos
esto antes algunos unos yo otro otras otra tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas
algo nosotros mi mis tu te ti tus ellas nosotras vosotros os mio mia tuyo tuya suyo nuestro vuestro esos esas estoy estamos
estaba bien mal hoy ayer tarde noche dia mes vida mundo casa ciudad pais tiempo hombre mujer persona gente parte lugar forma
caso grupo agua tierra fuego aire luz sol luna mar cielo calle camino puerta mesa silla libro carta mano ojo cabeza cuerpo
amigo padre madre hijo hija hermano familia trabajo escuela clase idea nombre palabra historia verdad momento problema
cosa punto lado fin orden mismo nuevo grande bueno largo alto bajo primero ultimo mejor peor mayor menor joven viejo libre
claro cierto propio real posible general social comun hacer decir poder ir ver dar saber querer llegar pasar deber poner
parecer quedar creer hablar llevar dejar seguir encontrar llamar venir pensar salir volver tomar conocer vivir sentir tratar
mirar contar empezar esperar buscar existir entrar trabajar escribir perder producir ocurrir entender pedir recibir recordar
terminar permitir aparecer conseguir comenzar servir sacar necesitar mantener resultar leer caer cambiar presentar crear
abrir considerar oir acabar convertir ganar formar traer partir morir aceptar realizar suponer comprender lograr explicar
tocar jugar cantar correr nadar comer beber dormir mover andar subir bajar cerrar mandar pagar valer sonar tecla teclado
rapido lento siempre nunca luego pronto ahora antes despues cerca lejos dentro fuera arriba abajo juntos solo casi tambien
mientras aunque entonces asi tan tal cada otro poco mucho menos algo nadie alguien ninguno varios demas bastante cualquiera
verde rojo azul negro blanco gris amarillo naranja ciento mil uno dos tres cuatro cinco seis siete ocho nueve diez
noche fuerte suave dulce frio calor viento lluvia nube arbol flor campo monte playa rio lago piedra papel color sonido musica
espacio sistema proceso proyecto codigo pantalla mundo red nivel valor modo base tipo dato total juego prueba equipo
año niño niña pequeño mañana sueño señal montaña español diseño otoño baño cuña`.split(/\s+/);

const LISTS: Record<TypingLanguage, string[]> = {
  en: Array.from(new Set(EN.filter(Boolean))),
  es: Array.from(new Set(ES.filter(Boolean))),
};

/** n random words with no immediate repeats. */
export function randomWords(language: TypingLanguage, n: number, after?: string): string[] {
  const list = LISTS[language];
  const out: string[] = [];
  let prev = after;
  while (out.length < n) {
    const w = list[Math.floor(Math.random() * list.length)];
    if (w === prev) continue;
    out.push(w);
    prev = w;
  }
  return out;
}
