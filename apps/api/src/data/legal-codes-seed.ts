/**
 * Seed de códigos legales argentinos — artículos más consultados
 *
 * Curación: artículos con mayor frecuencia de consulta por abogados de
 * Misiones, Corrientes, CABA y Buenos Aires.
 *
 * Fuentes:
 *   - CCCN (Ley 26.994 y modificatorias) — texto oficial
 *   - CPCCN (Ley 17.454 t.o. 1981 y modificatorias)
 *   - CPCC Misiones (Ley 4178 y modificatorias)
 *   - CPCC Corrientes (Ley 3948 y modificatorias)
 *   - LCT (Ley 20.744 t.o. 1976 y modificatorias)
 *   - Ley 24.522 — Concursos y Quiebras
 */

export interface SeedChunk {
  code:         string;
  jurisdiction: string;
  article:      string;
  sectionTitle?: string;
  text:         string;
}

export const LEGAL_CODE_SEED: SeedChunk[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // CCCN — Código Civil y Comercial de la Nación (Ley 26.994)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CCCN", jurisdiction: "nacional",
    article: "724", sectionTitle: "Obligaciones — Definición",
    text: "Obligación es la relación jurídica en virtud de la cual el acreedor tiene el derecho a exigir del deudor una prestación destinada a satisfacer un interés lícito y, ante el incumplimiento, a obtener forzadamente la satisfacción de dicho interés.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "725", sectionTitle: "Obligaciones — Requisitos",
    text: "La prestación que constituye el objeto de la obligación debe ser material y jurídicamente posible, lícita, determinada o determinable, susceptible de valoración económica y debe corresponder a un interés patrimonial o extrapatrimonial del acreedor.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "730", sectionTitle: "Obligaciones — Efectos con relación al acreedor",
    text: "La obligación da derecho al acreedor a: a) emplear los medios legales para que el deudor le procure aquello a que se ha obligado; b) hacérselo procurar por otro a costa del deudor; c) obtener del deudor las indemnizaciones correspondientes. Si el incumplimiento de la obligación, cualquiera sea su fuente, deriva en litigios judiciales o extrajudiciales, la responsabilidad por el pago de las costas, incluidos los honorarios profesionales, de todo tipo, allí devengados y correspondientes a la primera o única instancia, no debe exceder del veinticinco por ciento del monto de la sentencia, laudo, transacción o instrumento que ponga fin al diferendo. Si las regulaciones de honorarios practicadas conforme a las leyes arancelarias o usos locales, correspondientes a todas las profesiones y especialidades, superan dicho porcentaje, el juez debe proceder a prorratear los montos entre los beneficiarios.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "768", sectionTitle: "Obligaciones — Intereses moratorios",
    text: "A partir de su mora el deudor debe los intereses correspondientes. La tasa se determina: a) por lo que acuerden las partes; b) por lo que dispongan las leyes especiales; c) en subsidio, por tasas que se fijen según las reglamentaciones del Banco Central.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "771", sectionTitle: "Obligaciones — Facultades judiciales",
    text: "Los jueces pueden reducir los intereses cuando la tasa fijada o el resultado que provoca la capitalización de intereses excede, sin justificación y desproporcionadamente, el costo medio del dinero para deudores y operaciones similares en el lugar donde se contrajo la obligación. Los intereses pagados en exceso se imputan al capital y, una vez extinguido éste, pueden ser repetidos.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "886", sectionTitle: "Obligaciones — Mora del deudor",
    text: "La mora del deudor se produce por el solo transcurso del tiempo fijado para el cumplimiento de la obligación. El deudor que no ha cumplido en el tiempo convenido no puede excusarse en la imposibilidad de cumplimiento si ésta deriva de un hecho posterior a su mora. El acreedor incurre en mora si el deudor le efectúa una oferta de pago de conformidad con el artículo 904 y se rehúsa injustificadamente a recibirla.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "888", sectionTitle: "Obligaciones — Eximición",
    text: "Para eximirse de las consecuencias jurídicas derivadas de la mora, el deudor debe probar que no le es imputable, cualquiera sea el lugar de pago de la obligación.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "957", sectionTitle: "Contratos — Definición",
    text: "Contrato es el acto jurídico mediante el cual dos o más partes manifiestan su consentimiento para crear, regular, modificar, transferir o extinguir relaciones jurídicas patrimoniales.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "958", sectionTitle: "Contratos — Libertad de contratación",
    text: "Las partes son libres para celebrar un contrato y determinar su contenido, dentro de los límites impuestos por la ley, el orden público, la moral y las buenas costumbres.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "959", sectionTitle: "Contratos — Efecto vinculante",
    text: "Todo contrato válidamente celebrado es obligatorio para las partes. Su contenido sólo puede ser modificado o extinguido por acuerdo de partes o en los supuestos en que la ley lo prevé.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "961", sectionTitle: "Contratos — Buena fe",
    text: "Los contratos deben celebrarse, interpretarse y ejecutarse de buena fe. Obligan no sólo a lo que está formalmente expresado, sino a todas las consecuencias que puedan considerarse comprendidas en ellos, con los alcances en que razonablemente se habría obligado un contratante cuidadoso y previsor.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1061", sectionTitle: "Contratos — Intención común",
    text: "El contrato debe interpretarse conforme a la intención común de las partes y al principio de la buena fe.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1063", sectionTitle: "Contratos — Significado de las palabras",
    text: "Las palabras empleadas en el contrato deben entenderse en el sentido que les da el uso general, excepto que tengan un significado específico que surja de la ley, del acuerdo de partes o de los usos y prácticas del lugar de celebración conforme con los criterios dispuestos para la integración del contrato. Se aplican iguales reglas a las conductas, signos y expresiones no verbales con los que el consentimiento se manifiesta.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1078", sectionTitle: "Contratos — Disposiciones generales para la extinción",
    text: "Excepto disposición legal o convencional en contrario, se aplican a la rescisión unilateral, a la revocación y a la resolución las siguientes reglas generales: a) el derecho se ejerce mediante comunicación a la otra parte. La comunicación debe ser dirigida por todos los sujetos que integran una parte contra todos los sujetos que integran la otra; b) la extinción del contrato puede declararse extrajudicialmente o demandarse ante un juez. La demanda puede acumularse con la de daños y perjuicios u otras pretensiones; c) si el derecho de extinguir el contrato es subjetivamente inescindible, la comunicación de alguno de los colegitimados tiene efecto novatatorio de la relación con todos los otros; d) la extinción del contrato no queda afectada por la ineficacia de la cláusula que establece una tasa de interés o una pena, si éstas son divisibles de la obligación principal.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1082", sectionTitle: "Contratos — Reparación del daño",
    text: "La reparación del daño, cualquiera sea su fuente, debe integrarse con: a) el reembolso total o parcial del precio, según las circunstancias; b) la indemnización de daños y perjuicios.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1091", sectionTitle: "Contratos — Imprevisión",
    text: "Si en un contrato conmutativo de ejecución diferida o permanente, la prestación a cargo de una de las partes se torna excesivamente onerosa, por una alteración extraordinaria de las circunstancias existentes al tiempo de su celebración, sobrevenida por causas ajenas a las partes y al riesgo asumido por la que es afectada, ésta tiene derecho a plantear extrajudicialmente, o pedir ante un juez, por acción o como excepción, la resolución total o parcial del contrato, o su adecuación. Igual regla se aplica al tercero a quien le han sido conferidos derechos, o asignadas obligaciones, resultantes del contrato; y al contrato aleatorio si la prestación se torna excesivamente onerosa por causas extrañas a su álea propia.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1716", sectionTitle: "Responsabilidad civil — Deber de reparar",
    text: "La violación del deber de no dañar a otro, o el incumplimiento de una obligación, da lugar a la reparación del daño causado, conforme con las disposiciones de este Código.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1717", sectionTitle: "Responsabilidad civil — Antijuridicidad",
    text: "Cualquier acción u omisión que causa un daño a otro es antijurídica si no está justificada.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1737", sectionTitle: "Responsabilidad civil — Concepto de daño",
    text: "Hay daño cuando se lesiona un derecho o un interés no reprobado por el ordenamiento jurídico, que tenga por objeto la persona, el patrimonio, o un derecho de incidencia colectiva.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1738", sectionTitle: "Responsabilidad civil — Indemnización",
    text: "La indemnización comprende la pérdida o disminución del patrimonio de la víctima, el lucro cesante en el beneficio económico esperado de acuerdo a la probabilidad objetiva de su obtención y la pérdida de chances. Incluye especialmente las consecuencias de la violación de los derechos personalísimos de la víctima, de su integridad personal, su salud psicofísica, sus afecciones espirituales legítimas y las que resultan de la interferencia en su proyecto de vida.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1740", sectionTitle: "Responsabilidad civil — Reparación plena",
    text: "La reparación del daño debe ser plena. Consiste en la restitución de la situación del damnificado al estado anterior al hecho dañoso, sea por el pago en dinero o en especie. La víctima puede optar por el reintegro específico, excepto que sea parcial o totalmente imposible, excesivamente oneroso o abusivo, en cuyo caso se debe fijar en dinero. En el caso de daños derivados de la lesión del honor, la intimidad o la identidad personal, el juez puede, a pedido de parte, ordenar la publicación de la sentencia o de sus partes pertinentes, a cargo del responsable.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2537", sectionTitle: "Prescripción — Suspensión por interpelación fehaciente",
    text: "El curso de la prescripción se suspende, por una sola vez, por la interpelación fehaciente hecha por el titular del derecho contra el deudor o el poseedor. Esta suspensión sólo tiene efecto durante seis meses o el plazo menor que corresponda a la prescripción de la acción.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2560", sectionTitle: "Prescripción — Plazo genérico",
    text: "El plazo de la prescripción es de cinco años, excepto que esté previsto uno diferente en la legislación local.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2561", sectionTitle: "Prescripción — Plazos especiales",
    text: "El reclamo del resarcimiento de daños por agresiones sexuales infligidas a personas incapaces prescribe a los diez años. El cómputo del plazo de prescripción comienza desde que la víctima llega a la mayoría de edad. El reclamo de la indemnización de daños derivados de la responsabilidad civil prescribe a los tres años. Las acciones civiles derivadas de delitos de lesa humanidad son imprescriptibles.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCCN — Código Procesal Civil y Comercial de la Nación (Ley 17.454)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "163", sectionTitle: "Sentencia definitiva — Requisitos",
    text: "La sentencia definitiva de primera instancia deberá contener: 1) La mención del lugar y fecha. 2) El nombre y apellido de las partes. 3) La relación sucinta de las cuestiones que constituyen el objeto del juicio. 4) La consideración, por separado, de las cuestiones a que se refiere el inciso anterior. 5) Los fundamentos y la aplicación de la ley. Las presunciones no establecidas por ley constituirán prueba cuando se funden en hechos reales y probados y cuando por su número, precisión, gravedad y concordancia, produjeren convicción según la naturaleza del juicio, de conformidad con las reglas de la sana crítica. 6) La decisión expresa, positiva y precisa, de conformidad con las pretensiones deducidas en el juicio, calificadas según correspondiere por ley, declarando el derecho de los litigantes y condenando o absolviendo de la demanda y reconvención, en su caso, en todo o en parte. 7) El plazo que se otorgase para su cumplimiento, si fuere susceptible de ejecución. 8) El pronunciamiento sobre costas y la regulación de honorarios y, en su caso, la declaración de temeridad o malicia en los términos del artículo 34, inciso 6.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "195", sectionTitle: "Medidas cautelares — Oportunidad y presupuestos",
    text: "Las medidas cautelares podrán ser solicitadas antes o después de deducida la demanda, a menos que de la ley resultare que ésta debe entablarse previamente. El escrito en que se soliciten deberá expresar el derecho que se pretende asegurar, la medida que se pide, la disposición de la ley en que se funde y el cumplimiento de los requisitos que corresponden, en particular, a la medida requerida.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "199", sectionTitle: "Medidas cautelares — Contracautela",
    text: "La medida cautelar sólo podrá decretarse bajo la responsabilidad de la parte que la solicitare, quien deberá dar caución por todas las costas y daños y perjuicios que pudiere ocasionar en los casos en que la medida fuere indebidamente trabada. El juez graduará la calidad y monto de la caución de acuerdo con la mayor o menor verosimilitud del derecho y las circunstancias del caso. Podrá ofrecerse la garantía de instituciones bancarias o de personas de acreditada responsabilidad económica.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "209", sectionTitle: "Embargo preventivo — Procedencia",
    text: "Podrá pedir embargo preventivo el acreedor de deuda en dinero o en especie que se hallare en algunas de las siguientes condiciones: 1) Que el deudor no tenga domicilio en la República. 2) Que la existencia del crédito esté demostrada con instrumento público o privado atribuido al deudor, abonada la firma por información sumaria de dos testigos. 3) Que fundándose la acción en un contrato bilateral, se justifique su existencia en la misma forma del inciso anterior, aunque no se pruebe la mora del deudor. 4) Que la deuda esté justificada por libros de comercio llevados en debida forma por el actor, o resulte de boleto de corredor suscripto por ambas partes, si se tratare de contratos de compraventa de títulos, acciones u otras mercaderías. 5) Que aun estando la deuda sujeta a condición o plazo, se acredite que el deudor trata de enajenar, ocultar o transportar sus bienes, o que por cualquier causa ha disminuido notablemente su responsabilidad.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "330", sectionTitle: "Demanda — Requisitos",
    text: "La demanda será deducida por escrito y contendrá: 1) El nombre y domicilio del demandante. 2) El nombre y domicilio del demandado. 3) La cosa demandada, designándola con toda exactitud. 4) Los hechos en que se funde, explicados claramente. 5) El derecho expuesto sucintamente, evitando repeticiones innecesarias. 6) La petición en términos claros y positivos. La demanda deberá precisar el monto reclamado, salvo cuando al actor no le fuere posible determinarlo al promoverla, por las circunstancias del caso, o porque la estimación dependiere de elementos aún no definitivamente fijados y la promoción de la demanda fuese imprescindible para evitar la prescripción de la acción. En estos supuestos, no procederá la excepción de defecto legal.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "346", sectionTitle: "Excepciones previas — Enumeración",
    text: "Sólo se admitirán como previas las siguientes excepciones: 1) Incompetencia. 2) Falta de personería en el demandante, en el demandado o en sus representantes, por carecer de capacidad civil para estar en juicio o de representación suficiente. 3) Falta de legitimación para obrar en el actor o en el demandado, cuando fuere manifiesta, sin perjuicio, en caso de no concurrir esta última circunstancia, de que el juez la considere en la sentencia definitiva. 4) Litispendencia. 5) Defecto legal en el modo de proponer la demanda. 6) Cosa juzgada. 7) Transacción, conciliación y desistimiento del derecho. 8) Defensas temporarias que se consagran en las leyes generales, tales como el beneficio de inventario o el de excusión, u otras que, previstas en los contratos, tienen por objeto diferir el ejercicio de la acción.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "375", sectionTitle: "Carga de la prueba",
    text: "Incumbirá la carga de la prueba a la parte que afirme la existencia de un hecho controvertido o de un precepto jurídico que el juez o el tribunal no tenga el deber de conocer. Cada una de las partes deberá probar el presupuesto de hecho de la norma o normas que invocare como fundamento de su pretensión, defensa o excepción.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCC MISIONES — Código Procesal Civil y Comercial de Misiones (Ley 4178)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "1", sectionTitle: "Competencia — Principio general",
    text: "La competencia de los tribunales de la provincia de Misiones se determina conforme a las disposiciones de este Código y de la Ley Orgánica del Poder Judicial. Salvo disposición en contrario, la competencia no puede ser prorrogada ni delegada, excepto por acuerdo de partes en asuntos exclusivamente patrimoniales.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "5", sectionTitle: "Competencia territorial — Reglas generales",
    text: "La competencia se determinará por la naturaleza de las pretensiones deducidas en la demanda y no por las defensas opuestas por el demandado. Con excepción de los casos de prórroga expresa o tácita, cuando procediere, y sin perjuicio de las reglas especiales contenidas en este Código y en otras leyes, será juez competente: 1) Cuando se ejerciten acciones reales sobre bienes inmuebles, el del lugar donde esté situada la cosa litigiosa. Si éstas fuesen varias, o una sola pero situada en diferentes jurisdicciones judiciales, será el del lugar de cualquiera de ellas o de alguna de sus partes, siempre que allí tenga su domicilio el demandado. No concurriendo tal circunstancia, será el del lugar en que esté situada cualquiera de ellas, a elección del actor.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "150", sectionTitle: "Plazos — Carácter",
    text: "Los plazos procesales son perentorios. El vencimiento de un plazo implica la pérdida del derecho que se debía ejercer dentro de él, sin necesidad de declaración judicial ni de intimación alguna, salvo los casos en que este Código expresamente disponga otra cosa.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "151", sectionTitle: "Plazos — Cómputo",
    text: "Los plazos procesales se computan por días hábiles, salvo disposición expresa en contrario. No se cuentan los días inhábiles ni aquellos en que se suspenda la actividad judicial por decreto del Tribunal Superior de Justicia o por ley. Los plazos que vencieran en día inhábil quedarán prorrogados hasta el primer día hábil siguiente.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "155", sectionTitle: "Plazos — Ampliación por distancia",
    text: "Cuando la parte domiciliada fuera de la circunscripción del tribunal que entiende en el juicio deba cumplir algún acto procesal dentro de un plazo determinado, el plazo se ampliará a razón de un día por cada doscientos kilómetros o fracción no inferior a cien. Esta ampliación rige sólo en los casos en que la ley expresamente lo permita.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "195", sectionTitle: "Medidas cautelares — Oportunidad y presupuestos",
    text: "Las medidas cautelares podrán ser solicitadas antes o después de deducida la demanda. El solicitante deberá expresar el derecho que pretende asegurar, la medida que solicita, la disposición de la ley en que se funde y el cumplimiento de los requisitos que corresponden a la medida requerida. El juez podrá ordenarlas bajo la responsabilidad del peticionante, quien deberá ofrecer contracautela.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "198", sectionTitle: "Medidas cautelares — Contracautela",
    text: "La medida cautelar sólo podrá decretarse bajo la responsabilidad de la parte que la solicitare, quien deberá dar caución por todos los daños y perjuicios que pudiere ocasionar en los casos en que la medida fuere indebidamente trabada. El juez graduará la calidad y monto de la caución de acuerdo con la mayor o menor verosimilitud del derecho y las circunstancias del caso.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "233", sectionTitle: "Recursos — Apelación — Procedencia",
    text: "Son apelables las resoluciones definitivas de primera instancia. También son apelables las interlocutorias que causen gravamen irreparable, las que impongan multas y las que denieguen medidas cautelares. No son apelables las resoluciones que dispongan la realización de diligencias tendientes a averiguar la verdad de los hechos.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "234", sectionTitle: "Recursos — Apelación — Plazo",
    text: "El recurso de apelación deberá interponerse dentro del plazo de cinco días, salvo disposición en contrario. El recurso de apelación contra las sentencias definitivas en proceso ordinario deberá interponerse dentro del plazo de diez días.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "241", sectionTitle: "Recursos — Apelación — Expresión de agravios",
    text: "En el proceso ordinario, el apelante deberá fundar el recurso ante la cámara dentro del plazo de quince días. Al efecto, deberá criticar concretamente y razonadamente las partes del fallo que considera equivocadas. La simple manifestación de disconformidad con el pronunciamiento recurrido, sin expresión de argumentos que demuestren el error que se atribuye al tribunal, no constituye expresión de agravios.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "330", sectionTitle: "Demanda — Requisitos",
    text: "La demanda será deducida por escrito y contendrá: 1) El nombre y domicilio del demandante. 2) El nombre y domicilio del demandado. 3) La cosa demandada, designándola con toda exactitud. 4) Los hechos en que se funde, explicados claramente. 5) El derecho expuesto sucintamente, evitando repeticiones innecesarias. 6) La petición en términos claros y positivos. La demanda deberá precisar el monto reclamado, salvo cuando al actor no le fuere posible determinarlo al promoverla, por las circunstancias del caso, o porque la estimación dependiere de elementos aún no definitivamente fijados y la promoción de la demanda fuese imprescindible para evitar la prescripción de la acción.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "337", sectionTitle: "Traslado de la demanda",
    text: "Presentada la demanda en la forma prescripta, el juez dará traslado de ella al demandado para que comparezca y la conteste dentro del plazo de quince días, si se tratare de proceso ordinario. El emplazamiento se hará por cédula.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "340", sectionTitle: "Reconvención",
    text: "En el mismo escrito de contestación deberá el demandado deducir reconvención, en la forma prescripta para la demanda, si se creyere con derecho a reclamar algo en contra del actor. No haciéndolo entonces, no podrá deducirla después. La reconvención será admisible si las pretensiones en ella deducidas derivaren de la misma relación jurídica o fueren conexas con las invocadas en la demanda.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "374", sectionTitle: "Carga de la prueba",
    text: "Incumbirá la carga de la prueba a la parte que afirme la existencia de un hecho controvertido o de un precepto jurídico que el juez o el tribunal no tenga el deber de conocer. Cada una de las partes deberá probar el presupuesto de hecho de la norma o normas que invocare como fundamento de su pretensión, defensa o excepción.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "484", sectionTitle: "Juicio ejecutivo — Títulos ejecutivos",
    text: "Podrá ejecutarse el crédito que conste en: 1) Instrumento público presentado en forma. 2) Instrumento privado suscripto por el obligado, reconocido judicialmente o cuya firma estuviese certificada por escribano con intervención del obligado y registrada la certificación en el protocolo. 3) Confesión de deuda líquida y exigible prestada ante el juez competente para conocer en la ejecución. 4) Cuenta aprobada o reconocida. 5) Letra de cambio, factura de crédito, cobranza bancaria, vale o pagaré, cheque o constancia de saldo deudor en cuenta corriente bancaria, cuando tuvieren fuerza ejecutiva de conformidad con las disposiciones del Código de Comercio o ley especial. 6) Póliza de fletamento, liquidación de averías y demás contratos de navegación, en los casos en que las leyes de comercio los declaren ejecutivos. 7) Los demás títulos que las leyes especiales den fuerza ejecutiva.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCC CORRIENTES — Código Procesal Civil y Comercial de Corrientes (Ley 3948)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "150", sectionTitle: "Plazos — Perentoriedad",
    text: "Los plazos fijados en este Código son perentorios e improrrogables, salvo disposición expresa en contrario. Vencido un plazo, se perderá el derecho a realizar el acto procesal omitido sin necesidad de declaración expresa del juez.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "151", sectionTitle: "Plazos — Cómputo",
    text: "Los plazos se cuentan en días hábiles judiciales, salvo aquellos expresamente fijados en días corridos. No se cuentan los días inhábiles ni aquellos en que el tribunal no funcione por causa debidamente acreditada. Los plazos vencidos en día inhábil se prorrogan al primer día hábil siguiente.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "330", sectionTitle: "Demanda — Requisitos",
    text: "La demanda se deducirá por escrito y contendrá: 1) Nombre y domicilio del demandante. 2) Nombre y domicilio del demandado. 3) La cosa demandada designada con toda exactitud. 4) Los hechos en que se funde, explicados claramente. 5) El derecho invocado. 6) La petición en términos claros y positivos. La demanda deberá indicar el monto reclamado con fundamento específico para cada rubro.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "235", sectionTitle: "Recursos — Apelación — Plazo",
    text: "El recurso de apelación se interpondrá dentro del plazo de cinco días para las resoluciones interlocutorias y de diez días para las sentencias definitivas. El plazo se contará desde la notificación de la resolución recurrida.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "195", sectionTitle: "Medidas cautelares — Presupuestos",
    text: "Para el otorgamiento de las medidas cautelares se requiere: verosimilitud del derecho, peligro en la demora y prestación de contracautela suficiente. Las medidas podrán solicitarse antes de deducida la demanda, en cuyo caso caducarán si no se dedujere en el plazo de diez días hábiles desde que se traben.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LCT — Ley de Contrato de Trabajo (Ley 20.744 t.o. 1976)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "LCT", jurisdiction: "nacional",
    article: "4", sectionTitle: "Concepto de trabajo",
    text: "Constituye trabajo, a los fines de esta ley, toda actividad lícita que se preste en favor de quien tiene la facultad de dirigirla, mediante una remuneración. El contrato de trabajo tiene como principal objeto la actividad productiva y creadora del hombre en sí. Sólo después ha de entenderse que media entre las partes una relación de intercambio y un fin económico en cuanto se disciplina por esta ley.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "21", sectionTitle: "Contrato de trabajo — Definición",
    text: "Habrá contrato de trabajo, cualquiera sea su forma o denominación, siempre que una persona física se obligue a realizar actos, ejecutar obras o prestar servicios en favor de la otra y bajo la dependencia de ésta, durante un período determinado o indeterminado de tiempo, mediante el pago de una remuneración. Sus cláusulas, en cuanto a la forma y condiciones de la prestación, quedan sometidas a las disposiciones de orden público, los estatutos, las convenciones colectivas o los laudos con fuerza de tales y los usos y costumbres.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "23", sectionTitle: "Presunción de existencia del contrato de trabajo",
    text: "El hecho de la prestación de servicios hace presumir la existencia de un contrato de trabajo, salvo que por las circunstancias, las relaciones o causas que lo motiven se demostrase lo contrario. Esta presunción operará igualmente aun cuando se utilicen figuras no laborales, para caracterizar al contrato, y en tanto que por las circunstancias no sea dado calificar de empresario a quien presta el servicio.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "63", sectionTitle: "Obligación de obrar de buena fe",
    text: "Las partes están obligadas a obrar de buena fe, ajustando su conducta a lo que es propio de un buen empleador y de un buen trabajador, tanto al celebrar, ejecutar o extinguir el contrato o la relación de trabajo.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "232", sectionTitle: "Preaviso — Plazo",
    text: "El contrato de trabajo no podrá ser disuelto por voluntad de una de las partes, sin previo aviso, o en su defecto, indemnización además de la que corresponda al trabajador por su antigüedad en el empleo, cuando el contrato se disuelva por voluntad del empleador. El preaviso, cuando las partes no lo fijen en un término mayor, deberá darse con la anticipación siguiente: a) por el trabajador, de QUINCE (15) días; b) por el empleador, de QUINCE (15) días cuando el trabajador se encontrare en período de prueba; de UN (1) mes cuando el trabajador tuviese una antigüedad en el empleo que no exceda de cinco años y de DOS (2) meses cuando fuere superior.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "245", sectionTitle: "Indemnización por antigüedad — Despido",
    text: "En los casos de despido dispuesto por el empleador sin justa causa, habiendo o no mediado preaviso, éste deberá abonar al trabajador una indemnización equivalente a UN (1) mes de sueldo por cada año de servicio o fracción mayor de TRES (3) meses, tomando como base la mejor remuneración mensual, normal y habitual devengada durante el último año o durante el tiempo de prestación de servicios si éste fuera menor. Dicha base no podrá exceder el equivalente de TRES (3) veces el importe mensual de la suma que resulte del promedio de todas las remuneraciones previstas en el convenio colectivo de trabajo aplicable al trabajador al momento del despido por la jornada legal o convencional, excluida la antigüedad. Al Ministerio de Trabajo, Empleo y Seguridad Social le corresponderá fijar y publicar el tope indemnizatorio establecido en el párrafo anterior. En ningún caso la indemnización podrá ser inferior a UN (1) mes de sueldo calculado sobre la base del sistema establecido en el primer párrafo.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "246", sectionTitle: "Despido indirecto",
    text: "Cuando el trabajador hiciese denuncia del contrato de trabajo fundado en justa causa, tendrá derecho a las indemnizaciones previstas en los artículos 232, 233 y 245.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LCA — Ley 24.522 — Concursos y Quiebras
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "LCA", jurisdiction: "nacional",
    article: "1", sectionTitle: "Cesación de pagos — Presupuesto",
    text: "El estado de cesación de pagos, cualquiera sea su causa y la naturaleza de las obligaciones a las que afecte, es presupuesto para la apertura de los concursos regulados en esta ley, sin perjuicio de lo dispuesto por los artículos 66 y 69.",
  },
  {
    code: "LCA", jurisdiction: "nacional",
    article: "16", sectionTitle: "Actos prohibidos al concursado",
    text: "El concursado no puede realizar actos a título gratuito o que importen alterar la situación de los acreedores por causa o título anterior a la presentación. Debe abstenerse de hacer pagos, excepto los que correspondan al giro ordinario de su actividad. El juez puede autorizar actos de disposición o administración de bienes cuando sean necesarios para el cumplimiento del acuerdo o para la continuación de la actividad del concursado.",
  },
  {
    code: "LCA", jurisdiction: "nacional",
    article: "43", sectionTitle: "Período de exclusividad — Propuesta",
    text: "Dentro de los noventa (90) días desde que quede firme la resolución que hace saber el resultado del período informatorio, el deudor goza de un período de exclusividad para formular propuestas de acuerdo preventivo a sus acreedores y obtener su conformidad. Este plazo puede ser prorrogado por el juez por treinta (30) días más, si concurrieren causas justificadas.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CCCN — Derecho de Familia
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CCCN", jurisdiction: "nacional",
    article: "435", sectionTitle: "Matrimonio — Causas de disolución",
    text: "El matrimonio se disuelve por: a) muerte de uno de los cónyuges; b) sentencia firme de ausencia con presunción de fallecimiento; c) divorcio declarado judicialmente.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "437", sectionTitle: "Matrimonio — Divorcio. Requisitos",
    text: "El divorcio se decreta judicialmente a petición de ambos o de uno solo de los cónyuges.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "438", sectionTitle: "Matrimonio — Divorcio. Requisitos y procedimiento",
    text: "Toda petición de divorcio debe ser acompañada de una propuesta que regule los efectos derivados de éste; la omisión de la propuesta impide dar trámite a la petición. Si el divorcio es peticionado por uno solo de los cónyuges, el otro puede ofrecer una propuesta reguladora distinta. Al momento de formular las propuestas, las partes deben acompañar los elementos en que se fundan; el juez puede ordenar, de oficio o a petición de parte, que se incorporen otros que se estiman pertinentes. Las propuestas deben ser evaluadas por el juez, debiendo convocar a los cónyuges a una audiencia. En ningún caso el desacuerdo en el convenio suspende el dictado de la sentencia de divorcio.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "441", sectionTitle: "Matrimonio — Compensación económica",
    text: "El cónyuge a quien el divorcio produce un desequilibrio manifiesto que signifique un empeoramiento de su situación y que tiene por causa adecuada el vínculo matrimonial y su ruptura, tiene derecho a una compensación. Esta puede consistir en una prestación única, en una renta por tiempo determinado o, excepcionalmente, por plazo indeterminado. Puede pagarse con dinero, con el usufructo de determinados bienes o de cualquier otro modo que acuerden las partes o decida el juez.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "509", sectionTitle: "Uniones convivenciales — Requisitos",
    text: "Las disposiciones de este Título se aplican a la unión basada en relaciones afectivas de carácter singular, pública, notoria, estable y permanente de dos personas que conviven y comparten un proyecto de vida común, sean del mismo o de diferente sexo.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "537", sectionTitle: "Alimentos — Parientes obligados",
    text: "Los parientes se deben alimentos en el siguiente orden: a) los ascendientes y descendientes. Entre ellos, están obligados preferentemente los más próximos en grado; b) los hermanos bilaterales y unilaterales. En cualquiera de los supuestos, los alimentos son debidos por los que están en mejores condiciones para proporcionarlos.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "539", sectionTitle: "Alimentos — Caracteres",
    text: "La obligación de prestar alimentos no puede ser compensada, ni el derecho a reclamarlos o percibirlos, ser objeto de transacción, renuncia, cesión, gravamen o embargo alguno. Tampoco puede ser objeto de legado, entrega en pago, ni cualquier otra forma de disposición.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "541", sectionTitle: "Alimentos — Contenido de la obligación alimentaria",
    text: "La prestación de alimentos comprende lo necesario para la subsistencia, habitación, vestuario y asistencia médica, correspondientes a la condición del que la recibe, en la medida en que el alimentante pueda darlos. También comprende lo necesario para la educación del alimentado.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "542", sectionTitle: "Alimentos — Modo de cumplimiento",
    text: "La prestación se cumple mediante el pago de una renta en dinero, pero el obligado puede solicitar que se lo autorice a solventarla de otra manera, si justifica motivos suficientes.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "543", sectionTitle: "Alimentos — Proceso",
    text: "La petición de alimentos tramita por el proceso más breve que establezca la ley local, y no se acumula a otra pretensión.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "638", sectionTitle: "Responsabilidad parental — Concepto",
    text: "La responsabilidad parental es el conjunto de deberes y derechos que corresponden a los progenitores sobre la persona y bienes del hijo, para su protección, desarrollo y formación integral mientras sea menor de edad y no se haya emancipado.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "641", sectionTitle: "Responsabilidad parental — Titular",
    text: "Si uno de los progenitores no vive con el hijo, el ejercicio de la responsabilidad parental le corresponde al progenitor conviviente; el otro tiene el derecho y el deber de fluida comunicación con el hijo y de supervisar su educación, crianza y bienestar.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "646", sectionTitle: "Responsabilidad parental — Deberes de los hijos",
    text: "Son deberes de los hijos: a) respetar y obedecer a sus progenitores y demás ascendientes; b) cumplir con las decisiones de los progenitores que no sean contrarias a su interés superior; c) prestar colaboración propia de su edad y desarrollo en el hogar.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "655", sectionTitle: "Responsabilidad parental — Plan de parentalidad",
    text: "Los progenitores pueden presentar un plan de parentalidad relativo al cuidado del hijo, que contenga: a) lugar y tiempo en que el hijo permanece con cada progenitor; b) responsabilidades que cada uno asume; c) régimen de vacaciones, días festivos y otras fechas significativas para la familia; d) régimen de relación y comunicación del hijo con cada progenitor.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "658", sectionTitle: "Alimentos para los hijos",
    text: "Ambos progenitores tienen la obligación y el derecho de criar a sus hijos, alimentarlos y educarlos conforme a su condición y fortuna, aunque el cuidado personal esté a cargo de uno de ellos. La obligación de prestar alimentos a los hijos se extiende hasta los veintiún años, excepto que el obligado acredite que el hijo mayor de edad cuenta con recursos o ingresos propios suficientes para proveérselos él mismo.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "659", sectionTitle: "Contenido de la obligación alimentaria",
    text: "La obligación de alimentos comprende la satisfacción de las necesidades de los hijos de manutención, educación, esparcimiento, vestimenta, habitación, asistencia, gastos por enfermedad y los gastos necesarios para adquirir una profesión u oficio. Los alimentos están constituidos por prestaciones monetarias o en especie y son proporcionales a las necesidades del alimentado y a los recursos económicos del alimentante.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "663", sectionTitle: "Alimentos a los hijos mayores",
    text: "La obligación de los progenitores de proveer recursos al hijo subsiste hasta que éste alcance la edad de veinticinco años, si la prosecución de estudios o preparación profesional de un arte u oficio, le impide proveerse de medios necesarios para sostenerse independientemente. Pueden ser solicitados por el hijo o por el progenitor con quien convive; debe acreditar que la carencia de recursos no le es imputable.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CCCN — Derechos Reales y Locación
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1882", sectionTitle: "Derechos reales — Concepto",
    text: "El derecho real es el poder jurídico, de estructura legal, que se ejerce directamente sobre su objeto, en forma autónoma y que atribuye a su titular las facultades de persecución y preferencia, y las demás previstas en este Código.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1888", sectionTitle: "Derechos reales — Clasificación",
    text: "Son derechos reales sobre cosa propia: el dominio; el condominio; la propiedad horizontal; los conjuntos inmobiliarios; el tiempo compartido; el cementerio privado; la superficie. Los derechos reales sobre cosa ajena son: el usufructo; el uso; la habitación; la servidumbre; la hipoteca; la anticresis; la prenda.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1929", sectionTitle: "Dominio — Concepto",
    text: "El dominio perfecto es el derecho real que otorga todas las facultades de usar, gozar y disponer material y jurídicamente de una cosa, dentro de los límites previstos por la ley. El dominio se presume perfecto hasta que se pruebe lo contrario.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1945", sectionTitle: "Dominio — Extensión",
    text: "El dominio de una cosa comprende los objetos que forman un todo con ella o son sus accesorios. El dominio de una cosa inmueble se extiende al subsuelo y al espacio aéreo, en la medida en que su aprovechamiento sea posible, excepto lo dispuesto por leyes especiales.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2159", sectionTitle: "Hipoteca — Concepto",
    text: "La hipoteca es el derecho real de garantía que recae sobre uno o más inmuebles individualizados que continúan en poder del constituyente y que otorga al acreedor, ante el incumplimiento del deudor, las facultades de persecución y preferencia para cobrar sobre el producido de dichos bienes.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2160", sectionTitle: "Hipoteca — Legitimación",
    text: "Pueden constituir hipoteca los titulares de los derechos reales de dominio, condominio, propiedad horizontal, conjuntos inmobiliarios y superficie.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1187", sectionTitle: "Locación — Concepto",
    text: "Hay contrato de locación si una parte se obliga a otorgar a la otra el uso y goce temporario de una cosa, a cambio del pago de un precio en dinero. Al contrato de locación se aplica en subsidio lo dispuesto con respecto al consentimiento, precio y objeto del contrato de compraventa.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1188", sectionTitle: "Locación — Forma",
    text: "El contrato de locación de cosa inmueble o mueble registrable, de una universalidad que incluya a alguna de ellas, o de parte material de un inmueble, debe ser hecho por escrito. Esta regla se aplica también a sus prórrogas y modificaciones.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1198", sectionTitle: "Locación — Obligaciones del locador",
    text: "El locador debe: a) entregar la cosa conforme a lo acordado. A falta de previsión convencional debe entregarla en estado apropiado para su destino, excepto los defectos que el locatario conoció o pudo haber conocido; b) conservar la cosa con aptitud para el uso convenido; c) pagar las mejoras necesarias hechas por el locatario; d) pagar al locatario el mayor valor adquirido por la cosa como consecuencia de las mejoras hechas con su consentimiento; e) mantener al locatario en el uso y goce pacífico de la cosa durante el tiempo del contrato.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1200", sectionTitle: "Locación — Obligaciones del locatario",
    text: "El locatario debe: a) destinar la cosa al uso acordado, no usar la cosa para usos contrarios a la ley o reglamentos, ni causar daños a ésta; b) pagar el canon convenido; c) pagar las cargas y contribuciones que graven las cosas arrendadas; d) restituir la cosa al concluir el contrato.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1219", sectionTitle: "Locación — Extinción",
    text: "El contrato de locación se extingue: a) por el cumplimiento del plazo convenido, o del que fijen las leyes si el pactado no hubiese precedido; b) por resolución anticipada.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1221", sectionTitle: "Locación — Resolución anticipada",
    text: "El contrato de locación puede ser resuelto anticipadamente por el locatario: a) si la cosa locada es un inmueble y han transcurrido seis meses de contrato, debiendo notificar en forma fehaciente su decisión al locador. Si hace uso de la opción resolutoria en el primer año de vigencia de la relación locativa, debe abonar al locador, en concepto de indemnización, la suma equivalente a un mes y medio de alquiler al momento de desocupar el inmueble y la de un mes si la opción se ejercita transcurrido dicho lapso; b) en los casos del artículo 1199.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CCCN — Responsabilidad Civil (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1721", sectionTitle: "Responsabilidad civil — Factores de atribución",
    text: "La atribución de un daño al responsable puede basarse en factores objetivos o subjetivos. En ausencia de normativa, el factor de atribución es la culpa.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1722", sectionTitle: "Responsabilidad civil — Factor objetivo",
    text: "El factor de atribución es objetivo cuando la culpa del agente es irrelevante a los efectos de atribuir responsabilidad. En tales casos, el responsable se libera demostrando la causa ajena, excepto disposición legal en contrario.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1724", sectionTitle: "Responsabilidad civil — Factores subjetivos",
    text: "Son factores subjetivos de atribución la culpa y el dolo. La culpa consiste en la omisión de la diligencia debida según la naturaleza de la obligación y las circunstancias de las personas, el tiempo y el lugar. Comprende la imprudencia, la negligencia y la impericia en el arte o profesión. El dolo se configura por la producción de un daño de manera intencional o con manifiesta indiferencia por los intereses ajenos.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1730", sectionTitle: "Responsabilidad civil — Caso fortuito y fuerza mayor",
    text: "Se considera caso fortuito o fuerza mayor al hecho que no ha podido ser previsto o que, habiendo sido previsto, no ha podido ser evitado. El caso fortuito o fuerza mayor exime de responsabilidad, excepto disposición en contrario. Este Código emplea los términos 'caso fortuito' y 'fuerza mayor' como sinónimos.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1741", sectionTitle: "Responsabilidad civil — Indemnización de las consecuencias no patrimoniales",
    text: "Está legitimado para reclamar la indemnización de las consecuencias no patrimoniales el damnificado directo. Si del hecho resulta su muerte o sufre gran discapacidad también tienen legitimación a título personal, según las circunstancias, los ascendientes, los descendientes, el cónyuge y quienes convivían con aquél recibiendo trato familiar ostensible. La acción sólo se transmite a los sucesores universales del legitimado si es interpuesta por éste. El monto de la indemnización debe fijarse ponderando las satisfacciones sustitutivas y compensatorias que pueden procurar las sumas reconocidas.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1745", sectionTitle: "Responsabilidad civil — Indemnización por fallecimiento",
    text: "En caso de muerte, la indemnización debe consistir en: a) los gastos necesarios para asistencia y posterior funeral de la víctima; el derecho a repetirlos incumbe a quien los paga, aunque sea en razón de una obligación legal; b) lo necesario para alimentos del cónyuge, del conviviente, de los hijos menores de veintiún años de edad con derecho alimentario, de los hijos con discapacidad; c) la pérdida de chance de ayuda futura como consecuencia de la muerte de los hijos; d) desmedro económico causado al reclamante por la muerte del causante.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1746", sectionTitle: "Responsabilidad civil — Indemnización por lesiones",
    text: "En caso de lesiones o incapacidad permanente, física o psíquica, total o parcial, la indemnización debe ser evaluada mediante la determinación de un capital, de tal modo que sus rentas cubran la disminución de la aptitud del damnificado para realizar actividades productivas o económicamente valorables, y que se agote al término del plazo en que razonablemente pudo continuar realizando tales actividades. Se presumen los gastos médicos, farmacéuticos y por transporte que resultan razonables en función de la índole de las lesiones o la incapacidad. En el supuesto de incapacidad permanente se debe indemnizar el daño aunque el damnificado continúe ejerciendo una tarea remunerada. Esta indemnización procede aun cuando otra persona deba prestar alimentos al damnificado.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1757", sectionTitle: "Responsabilidad civil — Actividades riesgosas",
    text: "Toda persona responde por el daño causado por el riesgo o vicio de las cosas, o de las actividades que sean riesgosas o peligrosas por su naturaleza, por los medios empleados o por las circunstancias de su realización. La responsabilidad es objetiva. No son eximentes la autorización administrativa para el uso de la cosa o la realización de la actividad, ni el cumplimiento de las técnicas de prevención.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "1758", sectionTitle: "Responsabilidad civil — Sujetos responsables",
    text: "El dueño y el guardián son responsables concurrentes del daño causado por las cosas. Se considera guardián a quien ejerce, por sí o por terceros, el uso, la dirección y el control de la cosa, o a quien obtiene un provecho de ella. El dueño y el guardián no responden si prueban que la cosa fue usada en contra de su voluntad expresa o presunta. En caso de actividad riesgosa o peligrosa responde quien la realiza, se sirve u obtiene provecho de ella, por sí o por terceros, excepto lo dispuesto por la legislación especial.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CCCN — Prescripción (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2532", sectionTitle: "Prescripción — Ámbito de aplicación",
    text: "En ausencia de disposiciones específicas, las normas de este Capítulo son aplicables a la prescripción adquisitiva y liberatoria. Las legislaciones locales podrán regular esta última en cuanto al plazo de tributos.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2541", sectionTitle: "Prescripción — Interrupción por reconocimiento",
    text: "El curso de la prescripción se interrumpe: a) por el reconocimiento que el deudor o poseedor efectúa del derecho de aquel contra quien prescribe; b) por petición judicial.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2546", sectionTitle: "Prescripción — Interrupción por petición judicial",
    text: "El curso de la prescripción se interrumpe por toda petición del titular del derecho ante autoridad judicial que traduce su intención de no abandonarlo, contra el poseedor, su representante en la posesión, o el deudor, aunque sea defectuosa, realizada por persona incapaz, ante tribunal incompetente, o en el plazo de gracia previsto en el ordenamiento procesal aplicable.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2554", sectionTitle: "Prescripción — Cómputo del plazo",
    text: "El transcurso del plazo de prescripción comienza el día en que la prestación es exigible. En las obligaciones de no hacer, comienza cuando se produce el incumplimiento. En las obligaciones de garantía, cuando la evicción se ha producido efectivamente.",
  },
  {
    code: "CCCN", jurisdiction: "nacional",
    article: "2558", sectionTitle: "Prescripción — Acciones personales y reales",
    text: "El reclamo del resarcimiento de daños por agresiones sexuales infligidas a personas incapaces prescribe a los diez (10) años. El cómputo del plazo de prescripción comienza a partir del cese de la incapacidad.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LCT — Ley de Contrato de Trabajo (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "LCT", jurisdiction: "nacional",
    article: "92 bis", sectionTitle: "Período de prueba",
    text: "El contrato de trabajo por tiempo indeterminado, excepto el referido en el artículo 96, se entenderá celebrado a prueba durante los primeros TRES (3) meses de vigencia. Cualquiera de las partes podrá extinguir la relación durante ese lapso sin expresión de causa, sin derecho a indemnización con motivo de la extinción, pero con obligación de preavisar según lo establecido en los artículos 231 y 232. El empleador no puede contratar a un mismo trabajador, más de una vez, utilizando el período de prueba. De hacerlo, se considerará de pleno derecho, que el empleador ha renunciado al período de prueba. El uso abusivo del período de prueba con el objeto de evitar la efectivización de trabajadores será pasible de las sanciones previstas en los regímenes sobre infracciones a la legislación del trabajo.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "103", sectionTitle: "Remuneración — Concepto",
    text: "A los fines de esta ley, se entiende por remuneración la contraprestación que debe percibir el trabajador como consecuencia del contrato de trabajo. Dicha remuneración no podrá ser inferior al salario mínimo vital y móvil. El empleador debe al trabajador la remuneración, aunque éste no preste servicios, por la mera circunstancia de haber puesto su fuerza de trabajo a disposición de aquél.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "121", sectionTitle: "Sueldo anual complementario — Concepto",
    text: "Se entiende por sueldo anual complementario la doceava parte del total de las remuneraciones definidas en el Artículo 103 de esta ley, percibidas por el trabajador en el respectivo año calendario.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "150", sectionTitle: "Vacaciones — Licencia ordinaria",
    text: "El trabajador gozará de un período mínimo y continuado de descanso anual remunerado por los siguientes plazos: a) De catorce (14) días hábiles cuando la antigüedad en el empleo no exceda de cinco (5) años. b) De veintiún (21) días hábiles cuando siendo la antigüedad mayor de cinco (5) años no exceda de diez (10). c) De veintiocho (28) días hábiles cuando la antigüedad siendo mayor de diez (10) años no exceda de veinte (20). d) De treinta y cinco (35) días hábiles cuando la antigüedad exceda de veinte (20) años.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "208", sectionTitle: "Accidentes y enfermedades inculpables — Plazo",
    text: "Cada accidente o enfermedad inculpable que impida la prestación del servicio no afectará el derecho del trabajador a percibir su remuneración durante un período de tres (3) meses, si su antigüedad en el servicio fuere menor de cinco (5) años, y de seis (6) meses si fuera mayor. En los casos que el trabajador tuviere carga de familia y por las mismas circunstancias se encontrara impedido, los períodos durante los cuales tendrá derecho a percibir su remuneración se extenderán a seis (6) y doce (12) meses respectivamente, según si su antigüedad fuese inferior o superior a cinco (5) años.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "212", sectionTitle: "Accidentes y enfermedades inculpables — Reincorporación",
    text: "Vigente el plazo de conservación del empleo, si del accidente o enfermedad resultase una disminución definitiva en la capacidad laboral del trabajador y éste no estuviese en condiciones de realizar las tareas que anteriormente cumplía, el empleador deberá asignarle otras que pueda ejecutar sin disminución de su remuneración. Si el empleador no pudiese dar cumplimiento a esta obligación por causa que no le fuere imputable, deberá abonar al trabajador una indemnización igual a la prevista en el artículo 247 de esta ley.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "218", sectionTitle: "Suspensión disciplinaria",
    text: "Toda suspensión dispuesta por el empleador para ser considerada válida, deberá fundarse en justa causa, tener plazo fijo y ser notificada por escrito al trabajador.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "219", sectionTitle: "Justa causa de suspensión",
    text: "Se considera que tiene justa causa la suspensión que se deba a falta o disminución de trabajo no imputable al empleador, a razones disciplinarias o a causas económicas o tecnológicas.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "220", sectionTitle: "Plazo máximo de suspensión",
    text: "Las suspensiones fundadas en razones disciplinarias o debidas a falta o disminución de trabajo no imputables al empleador, no podrán exceder de treinta (30) días en un (1) año, contados a partir de la primera suspensión.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "242", sectionTitle: "Despido con justa causa — Injuria",
    text: "Una de las partes podrá hacer denuncia del contrato de trabajo en caso de inobservancia por parte de la otra de las obligaciones resultantes del mismo que configuren injuria y que, por su gravedad, no consienta la prosecución de la relación. La valoración deberá ser hecha prudencialmente por los jueces, teniendo en consideración el carácter de las relaciones que resulta de un contrato de trabajo, según lo disponen las leyes respectivas, y las modalidades y circunstancias personales en cada caso.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "243", sectionTitle: "Despido con justa causa — Comunicación",
    text: "El despido por justa causa dispuesto por el empleador como la denuncia del contrato de trabajo fundada en justa causa que hiciera el trabajador, deberán comunicarse por escrito, con expresión suficientemente clara de los motivos en que se funda la ruptura del contrato. Ante la demanda que promoviere la parte interesada, no se admitirá la modificación de la causal de despido consignada en las comunicaciones antes referidas.",
  },
  {
    code: "LCT", jurisdiction: "nacional",
    article: "255", sectionTitle: "Reingreso del trabajador",
    text: "La antigüedad del trabajador se establecerá conforme a lo dispuesto en los artículos 18 y 19 de esta ley, pero si hubiera mediado reingreso a las órdenes del mismo empleador se deducirá de las indemnizaciones de los artículos 245, 246, 247, 250, 251, 253 y 254 lo que el trabajador hubiera ya percibido en virtud de los mismos y por igual período.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCC Misiones — Procesos especiales y ejecución
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "319", sectionTitle: "Proceso sumarísimo — Trámite",
    text: "Cuando se reclamare contra una resolución u orden contraria a la Constitución o a las leyes, el juez o tribunal deberá ordenar que la cuestión se sustancie y resuelva por la vía del proceso sumarísimo. Se aplicará el trámite establecido en el artículo 321, con las siguientes modificaciones: 1) La prueba deberá ofrecerse con los escritos de demanda y contestación y no se admitirá ningún otro escrito ni deberán disponerse otras medidas probatorias que las que el tribunal estime absolutamente necesarias para la decisión; 2) El plazo para contestar la demanda y oponer excepciones será de cinco (5) días.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "321", sectionTitle: "Proceso sumarísimo — Reglas",
    text: "Será aplicable el procedimiento establecido en el artículo 319, con las siguientes modificaciones: 1) Con la demanda y contestación se ofrecerá la prueba y se agregará la documental; 2) No se admitirán excepciones de previo y especial pronunciamiento, ni reconvención; 3) Todos los plazos serán de tres días, con excepción del de contestación de demanda, y el otorgado para fundar la apelación, si correspondiere, que será de cinco días; 4) Los incidentes y excepciones que se susciten durante el trámite del juicio no suspenderán el procedimiento.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "502", sectionTitle: "Juicio ejecutivo — Intimación de pago",
    text: "Presentado el título con los recaudos indicados en los artículos anteriores, el juez, sin más trámite, examinará el instrumento con que se deduce la ejecución y, si hallare que es de los comprendidos en los artículos 498 y 499, librará mandamiento de intimación de pago y embargo, en su caso.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "543", sectionTitle: "Medidas cautelares — Inhibición general de bienes",
    text: "En todos los casos en que habiendo lugar a embargo éste no pudiere hacerse efectivo por no conocerse bienes del deudor, o por no cubrir éstos el importe del crédito reclamado, podrá solicitarse contra aquél la inhibición general de vender o gravar sus bienes, la que se deberá dejar sin efecto siempre que presentase a embargo bienes suficientes o diere caución bastante.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "232 bis", sectionTitle: "Tutela anticipada",
    text: "Dentro del proceso o con carácter preliminar a él, podrá solicitarse la tutela anticipatoria de los derechos cuando existiere verosimilitud del derecho invocado; peligro en la demora; urgencia que impida esperar la sentencia final; y cuando su rechazo pudiera causar un perjuicio irreparable o de difícil reparación. La medida podrá ser revisada en cualquier estado del proceso.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "360", sectionTitle: "Audiencia preliminar",
    text: "A los fines del artículo 358, el juez citará a las partes a una audiencia, que presidirá, con carácter indelegable. Si el juez no se hallare presente no se realizará la audiencia, debiéndose dejar constancia en el libro de asistencia. En tal acto: 1) Invitará a las partes a una conciliación o a encontrar otra forma de solución del conflicto, que él mismo propondrá. 2) Recibirá las manifestaciones de las partes sobre los hechos controvertidos, ratificando o rectificando los escritos de constitución del proceso. 3) Recibirá, si hubiera lugar a ella, la prueba confesional que las partes se hubieran pedido recíprocamente.",
  },
  {
    code: "CPCC_MISIONES", jurisdiction: "misiones",
    article: "163 bis", sectionTitle: "Sentencia — Honorarios profesionales",
    text: "En la sentencia definitiva, el juez deberá pronunciarse sobre las costas del proceso y regular los honorarios de los profesionales intervinientes, conforme lo establezca la ley arancelaria vigente en la provincia.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCC Corrientes (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "330", sectionTitle: "Demanda — Requisitos",
    text: "La demanda será deducida por escrito y contendrá: 1) El nombre y domicilio del demandante; 2) El nombre y domicilio del demandado; 3) La cosa demandada, designándola con toda exactitud; 4) Los hechos en que se funde, explicados claramente; 5) El derecho expuesto sucintamente, evitando repeticiones innecesarias; 6) La petición en términos claros y positivos. La demanda deberá precisar el monto reclamado, salvo cuando al actor no le fuere posible determinarlo al promoverla, por las circunstancias del caso, o porque la estimación dependiera de elementos aún no definitivamente fijados y la promoción de la demanda fuese imprescindible para evitar la prescripción de la acción.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "375", sectionTitle: "Carga de la prueba",
    text: "Incumbirá la carga de la prueba a la parte que afirme la existencia de un hecho controvertido o de un precepto jurídico que el juez o el tribunal no tenga el deber de conocer. Cada una de las partes deberá probar el presupuesto de hecho de la norma o normas que invocare como fundamento de su pretensión, defensa o excepción.",
  },
  {
    code: "CPCC_CORRIENTES", jurisdiction: "corrientes",
    article: "484", sectionTitle: "Juicio ejecutivo — Títulos ejecutivos",
    text: "Podrá prepararse la vía ejecutiva, pidiendo previamente: 1) Que el deudor reconozca la firma del instrumento privado con que se deduce la ejecución; 2) Que el deudor reconozca el cumplimiento de la condición, si la deuda fuese condicional; 3) Que el juez señale el plazo de la obligación, cuando el acto constitutivo de la obligación no lo indicare o dejare al arbitrio del acreedor. Sólo serán ejecutables los títulos que traigan aparejada ejecución, que son los que establecen una obligación de dar suma de dinero, líquida o fácilmente liquidable, en plazo vencido y exigible.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Ley 24.240 — Defensa del Consumidor
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "LDC", jurisdiction: "nacional",
    article: "1", sectionTitle: "Defensa del Consumidor — Objeto",
    text: "La presente ley tiene por objeto la defensa del consumidor o usuario. Se consideran consumidores o usuarios las personas físicas o jurídicas que adquieren o utilizan, en forma gratuita u onerosa, bienes o servicios como destinatarios finales, en beneficio propio o de su grupo familiar o social. Queda comprendida la adquisición de derechos en tiempos compartidos, clubes de campo, cementerios privados y figuras afines. Se considera asimismo consumidor o usuario a quien, sin ser parte de una relación de consumo como consecuencia o en ocasión de ella, adquiere o utiliza bienes o servicios, en forma gratuita u onerosa, como destinatario final, en beneficio propio o de su grupo familiar o social.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "4", sectionTitle: "Defensa del Consumidor — Información",
    text: "El proveedor está obligado a suministrar al consumidor en forma cierta, clara y detallada todo lo relacionado con las características esenciales de los bienes y servicios que provee, y las condiciones de su comercialización. La información debe ser siempre gratuita para el consumidor y proporcionada con claridad necesaria que permita su comprensión.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "8 bis", sectionTitle: "Defensa del Consumidor — Trato digno",
    text: "Los proveedores deberán garantizar condiciones de atención y trato digno y equitativo a los consumidores y usuarios. Deberán abstenerse de desplegar conductas que coloquen a los consumidores en situaciones vergonzantes, vejatorias o intimidatorias. No podrán ejercer sobre los consumidores extranjeros diferenciación alguna sobre precios, calidades técnicas o comerciales o cualquier otro aspecto relevante de los bienes y servicios que comercialice. Cualquier excepción a lo señalado deberá ser autorizada por la autoridad de aplicación en razones de interés general debidamente fundadas.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "10 bis", sectionTitle: "Defensa del Consumidor — Incumplimiento de la oferta",
    text: "El incumplimiento de la oferta o del contrato por el proveedor, salvo caso fortuito o fuerza mayor, faculta al consumidor, a su libre elección a: a) Exigir el cumplimiento forzado de la obligación, siempre que ello fuera posible; b) Aceptar otro producto o prestación de servicio equivalente; c) Rescindir el contrato con derecho a la restitución de lo pagado, sin perjuicio de los efectos producidos, considerando la integridad del contrato. Todo ello sin perjuicio de las acciones de daños y perjuicios que correspondan.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "37", sectionTitle: "Defensa del Consumidor — Contratos de adhesión",
    text: "Sin perjuicio de la validez del contrato, se tendrán por no convenidas: a) Las cláusulas que desnaturalicen las obligaciones o limiten la responsabilidad por daños; b) Las cláusulas que importen renuncia o restricción de los derechos del consumidor o amplíen los derechos de la otra parte; c) Las cláusulas que contengan cualquier precepto que imponga la inversión de la carga de la prueba en perjuicio del consumidor. La interpretación del contrato se hará en el sentido más favorable para el consumidor. Cuando existan dudas sobre los alcances de su obligación, se estará a la que sea menos gravosa.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "40", sectionTitle: "Defensa del Consumidor — Responsabilidad solidaria",
    text: "Si el daño al consumidor resulta del vicio o riesgo de la cosa o de la prestación del servicio, responderán el productor, el fabricante, el importador, el distribuidor, el proveedor, el vendedor y quien haya puesto su marca en la cosa o servicio. El transportista responderá por los daños ocasionados a la cosa con motivo o en ocasión del servicio. La responsabilidad es solidaria, sin perjuicio de las acciones de repetición que correspondan. Sólo se liberará total o parcialmente quien demuestre que la causa del daño le ha sido ajena.",
  },
  {
    code: "LDC", jurisdiction: "nacional",
    article: "52 bis", sectionTitle: "Defensa del Consumidor — Daño punitivo",
    text: "Al proveedor que no cumpla sus obligaciones legales o contractuales con el consumidor, a instancia del damnificado, el juez podrá aplicar una multa civil a favor del consumidor, la que se graduará en función de la gravedad del hecho y demás circunstancias del caso, independientemente de otras indemnizaciones que correspondan. Cuando más de un proveedor sea responsable del incumplimiento responderán todos solidariamente ante el consumidor, sin perjuicio de las acciones de regreso que les correspondan. La multa civil que se imponga no podrá superar el máximo de la sanción de multa prevista en el artículo 47, inciso b) de esta ley.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Código Penal de la Nación Argentina
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CP", jurisdiction: "nacional",
    article: "1", sectionTitle: "Código Penal — Ámbito de aplicación",
    text: "Este código se aplicará: 1º) Por delitos cometidos o cuyos efectos deban producirse en el territorio de la Nación Argentina, o en los lugares sometidos a su jurisdicción; 2º) Por delitos cometidos en el extranjero por agentes o empleados de autoridades argentinas en desempeño de su cargo.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "45", sectionTitle: "Código Penal — Autoría y participación",
    text: "Los que tomasen parte en la ejecución del hecho o prestasen al autor o autores un auxilio o cooperación sin los cuales no habría podido cometerse, tendrán la pena establecida para el delito. En la misma pena incurrirán los que hubiesen determinado directamente a otro a cometerlo.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "54", sectionTitle: "Código Penal — Concurso ideal",
    text: "Cuando un hecho cayere bajo más de una sanción penal, se aplicará solamente la que fijare pena mayor.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "55", sectionTitle: "Código Penal — Concurso real",
    text: "Cuando concurrieren varios hechos independientes reprimidos con una misma especie de pena, la pena aplicable al reo tendrá como mínimo, el mínimo mayor y como máximo, la suma aritmética de las penas máximas correspondientes a los diversos hechos. Sin embargo, esta suma no podrá exceder de (50) cincuenta años de reclusión o prisión.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "79", sectionTitle: "Código Penal — Homicidio simple",
    text: "Se aplicará reclusión o prisión de ocho a veinticinco años, al que matare a otro siempre que en este código no se estableciere otra pena.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "89", sectionTitle: "Código Penal — Lesiones leves",
    text: "Se impondrá prisión de un mes a un año, al que causare a otro, en el cuerpo o en la salud, un daño que no esté previsto en otra disposición de este código.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "90", sectionTitle: "Código Penal — Lesiones graves",
    text: "Se impondrá reclusión o prisión de uno a seis años, si la lesión produjere una debilitación permanente de la salud, de un sentido, de un órgano, de un miembro o una dificultad permanente de la palabra o si hubiere puesto en peligro la vida del ofendido, le hubiere inutilizado para el trabajo por más de un mes o le hubiere causado una deformación permanente del rostro.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "162", sectionTitle: "Código Penal — Hurto",
    text: "Será reprimido con prisión de un mes a dos años, el que se apoderare ilegítimamente de una cosa mueble, total o parcialmente ajena.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "164", sectionTitle: "Código Penal — Robo",
    text: "Será reprimido con prisión de un mes a seis años, el que se apoderare ilegítimamente de una cosa mueble, total o parcialmente ajena, con fuerza en las cosas o con violencia física en las personas, sea que la violencia tenga lugar antes del robo para facilitarlo, en el acto de cometerlo o después de cometido para procurar su impunidad.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "172", sectionTitle: "Código Penal — Estafa",
    text: "Será reprimido con prisión de un mes a seis años, el que defraudare a otro con nombre supuesto, calidad simulada, falsos títulos, influencia mentida, abuso de confianza o aparentando bienes, crédito, comisión, empresa o negociación o valiéndose de cualquier otro ardid o engaño.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "183", sectionTitle: "Código Penal — Daño",
    text: "Será reprimido con prisión de quince días a un año, el que destruyere, inutilizare, hiciere desaparecer o de cualquier modo dañare una cosa mueble o inmueble o un animal, total o parcialmente ajeno, siempre que el hecho no constituya otro delito más severamente penado.",
  },
  {
    code: "CP", jurisdiction: "nacional",
    article: "248", sectionTitle: "Código Penal — Abuso de autoridad",
    text: "Será reprimido con prisión de un mes a dos años e inhabilitación especial por doble tiempo, el funcionario público que dictare resoluciones u órdenes contrarias a las constituciones o leyes nacionales o provinciales o ejecutare las órdenes o resoluciones de esta clase existentes o no ejecutare las leyes cuyo cumplimiento le incumbiere.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CPCCN (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "43", sectionTitle: "Acumulación de procesos",
    text: "Procederá la acumulación de procesos cuando en ellos exista conexidad por razón del objeto o de la causa. Se requerirá, además, que los procesos se encuentren en la misma instancia.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "77", sectionTitle: "Costas — Principio general",
    text: "La parte vencida en el juicio deberá pagar todos los gastos de la contraria, aun cuando ésta no lo hubiese solicitado. Sin embargo, el juez podrá eximir total o parcialmente de esta responsabilidad al litigante vencido, siempre que encontrare mérito para ello, expresándolo en su pronunciamiento, bajo pena de nulidad.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "163", sectionTitle: "Sentencia definitiva — Contenido",
    text: "La sentencia definitiva de primera instancia deberá contener: 1) La mención del lugar y fecha. 2) El nombre y apellido de las partes. 3) La relación sucinta de las cuestiones que constituyen el objeto del juicio. 4) La consideración, por separado, de las cuestiones a que se refiere el inciso anterior. 5) Los fundamentos y la aplicación de la ley. Las presunciones no establecidas por ley constituirán prueba cuando se funden en hechos reales y probados y cuando por su número, precisión, gravedad y concordancia, produjeren convicción según la naturaleza del juicio, de conformidad con las reglas de la sana crítica. 6) La decisión expresa, positiva y precisa, de conformidad con las pretensiones deducidas en el juicio.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "198", sectionTitle: "Medidas cautelares — Modificación y sustitución",
    text: "Las medidas precautorias se dispondrán bajo la responsabilidad de la parte que las pidiere, quien deberá dar caución bastante. Sin embargo, podrán disponerse sin caución si quien las solicitare fuese la Nación, una provincia, una municipalidad o una repartición autárquica, o persona que justificare ser reconocidamente abonada.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "209", sectionTitle: "Embargo preventivo — Procedencia",
    text: "Podrá pedir embargo preventivo el acreedor de deuda en dinero o en especie, si justificare o si hubiere motivo para temer que la actuación del deudor pudiere frustrar el resultado de la sentencia.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "346", sectionTitle: "Excepciones previas — Oportunidad",
    text: "Las excepciones previas se opondrán conjuntamente, dentro del plazo para contestar la demanda o para comparecer en el juicio, según la naturaleza del proceso. No se admitirán prueba ni alegatos después de que el juez llame autos para dictar resolución.",
  },
  {
    code: "CPCCN", jurisdiction: "nacional",
    article: "386", sectionTitle: "Apreciación de la prueba",
    text: "Salvo disposición legal en contrario, los jueces formarán su convicción respecto de la prueba, de conformidad con las reglas de la sana crítica. No tendrán el deber de expresar en la sentencia la valoración de todas las pruebas producidas, sino únicamente de las que fueren esenciales y decisivas para el fallo de la causa.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LCA — Ley 24.522 — Concursos y Quiebras (ampliación)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: "LCA", jurisdiction: "nacional",
    article: "57", sectionTitle: "Concurso preventivo — Homologación",
    text: "No deducidas las impugnaciones en término, o rechazadas las interpuestas, el juez homologa el acuerdo si ha sido logrado de acuerdo con las mayorías del artículo 45. Sólo puede requerir al acuerdo que se ajuste a la ley. Una vez homologado, el juez regula honorarios e impone las costas.",
  },
  {
    code: "LCA", jurisdiction: "nacional",
    article: "106", sectionTitle: "Quiebra — Apertura",
    text: "La declaración de quiebra importa la exigibilidad de todas las obligaciones pendientes del fallido. Si la resolución de apertura de concurso es posterior a la sentencia de quiebra, ésta será declarada sin más trámite y con sus consecuencias sobre los bienes del deudor.",
  },
  {
    code: "LCA", jurisdiction: "nacional",
    article: "111", sectionTitle: "Quiebra — Desapoderamiento",
    text: "El fallido queda desapoderado de pleno derecho de sus bienes existentes a la fecha de la declaración de la quiebra y de los que adquiriera hasta su rehabilitación. El desapoderamiento impide al fallido ejercer los derechos de disposición y administración.",
  },
];
