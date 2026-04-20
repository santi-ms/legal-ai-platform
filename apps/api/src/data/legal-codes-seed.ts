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
];
