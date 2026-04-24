import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Términos y Condiciones | DocuLex",
  description:
    "Términos y Condiciones de uso de DocuLex. Plataforma de generación de documentos legales con inteligencia artificial para abogados y estudios jurídicos en Argentina.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://doculex.com.ar/terminos" },
};

// ─── Last updated ──────────────────────────────────────────────────────────────
const LAST_UPDATED = "24 de abril de 2026";

export default function TerminosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white dark:bg-background-dark">
        {/* Hero */}
        <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-primary font-semibold uppercase tracking-wide mb-3">
              DocuLex · Documento Legal
            </p>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Última actualización: {LAST_UPDATED}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-li:leading-relaxed max-w-none">

            <p>
              Los presentes Términos y Condiciones (en adelante, «los Términos») regulan el acceso y uso
              de la plataforma <strong>DocuLex</strong> (en adelante, «la Plataforma»), operada por
              <strong> DocuLex S.R.L.</strong> (en adelante, «la Empresa»), con domicilio en la
              República Argentina.
            </p>
            <p>
              Al registrarse o utilizar la Plataforma, el usuario (en adelante, «el Usuario») acepta
              íntegramente los presentes Términos. Si no está de acuerdo, debe abstenerse de utilizar
              la Plataforma.
            </p>

            {/* ── 1 ── */}
            <h2>1. Definiciones</h2>
            <ul>
              <li>
                <strong>Plataforma:</strong> el servicio web accesible en{" "}
                <a href="https://doculex.com.ar">doculex.com.ar</a> y sus subdominios,
                incluyendo la API y las aplicaciones asociadas.
              </li>
              <li>
                <strong>Servicio:</strong> las funciones de generación asistida de documentos legales,
                gestión de expedientes, agenda y demás herramientas disponibles en la Plataforma.
              </li>
              <li>
                <strong>Usuario:</strong> toda persona física o jurídica que acceda o utilice la
                Plataforma, sea en calidad de abogado matriculado, estudio jurídico, empresa o
                particular.
              </li>
              <li>
                <strong>Contenido Generado:</strong> todo documento, borrador, texto o resumen
                producido por los modelos de inteligencia artificial integrados en la Plataforma a
                partir de los datos ingresados por el Usuario.
              </li>
              <li>
                <strong>Datos del Usuario:</strong> información proporcionada por el Usuario al
                registrarse, completar formularios o interactuar con el chat de la Plataforma.
              </li>
            </ul>

            {/* ── 2 ── */}
            <h2>2. Naturaleza del Servicio y Descargo de Responsabilidad sobre Inteligencia Artificial</h2>
            <p>
              DocuLex es una herramienta de <strong>asistencia tecnológica</strong> que facilita la
              redacción de documentos legales, la investigación jurisprudencial y la gestión
              administrativa de estudios jurídicos mediante el uso de modelos de
              <strong> inteligencia artificial generativa</strong> de terceros (entre ellos, Anthropic
              PBC — Claude). Todo el Contenido Generado tiene carácter <strong>informativo y de
              borrador</strong>; no constituye asesoramiento jurídico, no reemplaza la intervención
              de un profesional del derecho habilitado y no garantiza la adecuación del documento,
              la cita normativa o la jurisprudencia referida a la situación particular del Usuario
              ni a la normativa vigente aplicable.
            </p>
            <p>
              El Usuario reconoce y acepta expresamente las siguientes limitaciones propias de los
              modelos de inteligencia artificial generativa:
            </p>
            <ul>
              <li>
                <strong>Posibles inexactitudes o “alucinaciones”:</strong> los modelos pueden
                producir citas normativas, jurisprudenciales, montos, plazos o referencias que
                no existen, están desactualizados o son incorrectos.
              </li>
              <li>
                <strong>Desactualización:</strong> el Contenido Generado puede no reflejar reformas
                legales, doctrina o jurisprudencia posteriores al corte de entrenamiento del modelo.
              </li>
              <li>
                <strong>Sesgo y variabilidad:</strong> distintas consultas con idéntica entrada
                pueden generar resultados diferentes.
              </li>
              <li>
                <strong>Dependencia del profesional:</strong> la calidad del resultado depende de
                la información ingresada por el Usuario y de la revisión profesional posterior.
              </li>
            </ul>
            <p>
              En consecuencia, el Usuario se obliga a <strong>verificar y validar profesionalmente
              todo Contenido Generado</strong> antes de suscribirlo, presentarlo ante autoridades,
              entregarlo a clientes o utilizarlo con cualquier fin jurídico. La responsabilidad
              profesional por el contenido final de cualquier documento, presentación o consejo
              basado en la Plataforma recae <strong>íntegramente sobre el profesional del derecho
              que lo utilice</strong>.
            </p>
            <p>
              La Empresa <strong>no asume responsabilidad alguna</strong> por:
            </p>
            <ul>
              <li>
                Errores, omisiones, alucinaciones o inexactitudes del Contenido Generado por los
                modelos de inteligencia artificial.
              </li>
              <li>
                Daños directos, indirectos, incidentales, consecuentes, lucro cesante o pérdida
                de oportunidad causados por la utilización o imposibilidad de utilización del
                Servicio o de los documentos generados.
              </li>
              <li>
                La validez, eficacia, ejecutabilidad o admisibilidad procesal de los documentos
                generados, que dependen exclusivamente de la revisión y aprobación del profesional
                del derecho interviniente.
              </li>
              <li>
                Cambios normativos, doctrinarios o jurisprudenciales posteriores a la fecha de
                generación del documento que afecten su contenido o vigencia.
              </li>
              <li>
                Interrupciones, caídas o demoras de los servicios de terceros (modelos de IA,
                proveedores de pago, proveedores de hosting, portales judiciales).
              </li>
            </ul>
            <p>
              Sin perjuicio de lo anterior, la responsabilidad eventual de la Empresa por cualquier
              causa quedará limitada, en la máxima medida permitida por la ley aplicable, al monto
              efectivamente abonado por el Usuario a la Empresa en concepto de suscripción durante
              los <strong>doce (12) meses</strong> previos al hecho que motive el reclamo.
            </p>

            {/* ── 2.1 ── */}
            <h3>2.1 Datos de clientes y terceros ingresados por el Usuario</h3>
            <p>
              El Usuario, cuando actúe en ejercicio de la profesión legal, reconoce que al ingresar
              en la Plataforma datos de sus propios clientes, contrapartes o terceros (en adelante,
              «Datos de Terceros») lo hace bajo su exclusiva responsabilidad profesional y conforme
              al <strong>deber de secreto profesional</strong> que le impone la Ley 23.187 (CABA),
              las leyes provinciales que regulan el ejercicio de la abogacía y el Código Civil y
              Comercial de la Nación.
            </p>
            <p>
              El Usuario declara y garantiza que cuenta con la base legal, el consentimiento o el
              mandato necesarios —conforme a la Ley N.º 25.326— para tratar los Datos de Terceros
              e ingresarlos en la Plataforma. Respecto de dichos Datos de Terceros, la Empresa
              actuará como <strong>encargado del tratamiento</strong> (art. 25 Ley 25.326),
              limitando su uso al cumplimiento de las finalidades del Servicio y aplicando las
              medidas técnicas y organizativas descriptas en la Política de Privacidad.
            </p>

            {/* ── 3 ── */}
            <h2>3. Registro y Cuenta de Usuario</h2>
            <p>
              Para acceder al Servicio, el Usuario deberá crear una cuenta proporcionando información
              verdadera, completa y actualizada. El Usuario es responsable de mantener la
              confidencialidad de sus credenciales y de todas las actividades realizadas desde su cuenta.
            </p>
            <p>
              La Empresa se reserva el derecho de suspender o dar de baja la cuenta de cualquier
              Usuario que incumpla los presentes Términos, sin perjuicio de las acciones legales
              que correspondan.
            </p>

            {/* ── 4 ── */}
            <h2>4. Planes, Precios y Facturación</h2>
            <p>
              DocuLex ofrece distintos planes de suscripción (Free, Pro, Pro+ y Estudio), cuyos
              precios, límites de uso y funciones incluidas se detallan en la página de precios de
              la Plataforma y pueden modificarse conforme a la cláusula 4.3. Los precios se
              encuentran expresados en <strong>pesos argentinos (ARS)</strong>, con los impuestos
              correspondientes incluidos o discriminados según la normativa vigente.
            </p>
            <p>
              El pago de los planes de pago se procesa a través de <strong>Mercado Pago</strong> como
              procesador certificado. La Empresa no almacena números de tarjetas de crédito, débito
              ni datos sensibles de pago. Las suscripciones se renuevan automáticamente al
              vencimiento del período contratado, salvo que el Usuario las cancele desde la
              configuración de la Plataforma antes de dicha fecha.
            </p>
            <p>
              <strong>Límites de uso:</strong> cada plan incluye límites mensuales o totales sobre
              documentos generados, análisis realizados, consultas a la IA, clientes y expedientes
              administrados. Alcanzar un límite implica la suspensión temporal de la función
              correspondiente hasta el siguiente ciclo de facturación o hasta que el Usuario actualice
              su plan. Los límites vigentes se informan en el panel «Uso actual» de la Plataforma.
            </p>
            <p>
              <strong>4.3 Modificación de precios:</strong> la Empresa podrá modificar los precios o
              los límites de uso notificando al Usuario con al menos treinta (30) días de
              anticipación. La continuación del uso del Servicio tras la notificación implicará la
              aceptación del nuevo precio. Durante el período de notificación el Usuario podrá
              cancelar sin penalidad.
            </p>
            <p>
              <strong>4.4 Códigos promocionales:</strong> los códigos promocionales otorgan acceso
              temporal a planes de pago o descuentos. Cada tenant puede canjear un único código. Los
              códigos son intransferibles, no acumulables y no canjeables por dinero.
            </p>

            {/* ── 5 ── */}
            <h2>5. Uso Permitido y Prohibido</h2>
            <h3>5.1 Uso permitido</h3>
            <p>El Usuario podrá utilizar la Plataforma para:</p>
            <ul>
              <li>Generar borradores de documentos legales con fines profesionales o personales.</li>
              <li>Gestionar expedientes, clientes y agenda en el marco de su actividad lícita.</li>
              <li>Compartir documentos con clientes o colegas según las funciones habilitadas.</li>
            </ul>
            <h3>5.2 Uso prohibido</h3>
            <p>Queda expresamente prohibido:</p>
            <ul>
              <li>
                Utilizar la Plataforma para generar documentos con fines fraudulentos, ilícitos o
                contrarios al orden público.
              </li>
              <li>
                Reproducir, distribuir, sublicenciar o comercializar el Servicio sin autorización
                expresa de la Empresa.
              </li>
              <li>
                Intentar acceder sin autorización a sistemas, bases de datos o cuentas de otros
                usuarios.
              </li>
              <li>
                Introducir virus, malware u otros elementos dañinos en la Plataforma.
              </li>
              <li>
                Hacer scraping o extracción masiva de datos de la Plataforma por medios
                automatizados.
              </li>
            </ul>

            {/* ── 6 ── */}
            <h2>6. Propiedad Intelectual</h2>
            <p>
              Todos los derechos sobre la Plataforma, su diseño, código fuente, modelos de IA,
              marcas, logotipos y contenidos propios son propiedad exclusiva de la Empresa o de sus
              licenciantes, y se encuentran protegidos por la Ley N.º 11.723 de Propiedad Intelectual
              y demás normativa aplicable.
            </p>
            <p>
              El Contenido Generado a partir de los datos del Usuario pertenece al Usuario, quien
              otorga a la Empresa una licencia limitada y no exclusiva para procesar y almacenar
              dicho contenido con el único fin de prestar el Servicio.
            </p>

            {/* ── 6.1 ── */}
            <h2>6.1 Integración con Portales Judiciales</h2>
            <p>
              Cuando el Usuario decida habilitar la función opcional de sincronización con portales
              judiciales (por ejemplo, MEV Misiones, Poder Judicial de la Nación, SCBA, Poder
              Judicial de Corrientes), deberá cargar sus propias credenciales de acceso. El Usuario:
            </p>
            <ul>
              <li>
                Declara que tiene derecho a utilizar esas credenciales y que accede a los portales
                en el marco de expedientes en los que interviene legítimamente.
              </li>
              <li>
                Autoriza a la Empresa a utilizarlas <strong>exclusivamente</strong> para consultar
                el estado de expedientes en nombre del Usuario y descargar las actuaciones
                asociadas.
              </li>
              <li>
                Reconoce que las credenciales se almacenan <strong>cifradas</strong> y que la
                Empresa no asume responsabilidad por los cambios en los portales externos ni por
                indisponibilidad de los mismos.
              </li>
            </ul>
            <p>
              El Usuario puede revocar esta autorización en cualquier momento eliminando las
              credenciales desde la configuración del Servicio.
            </p>

            {/* ── 7 ── */}
            <h2>7. Protección de Datos Personales</h2>
            <p>
              El tratamiento de datos personales se rige por la{" "}
              <strong>Ley N.º 25.326 de Protección de Datos Personales</strong> y su decreto
              reglamentario N.º 1558/2001. Para mayor información, consulte nuestra{" "}
              <Link href="/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
              , que describe los subprocesadores utilizados, las transferencias internacionales de
              datos, el derecho de portabilidad y los mecanismos para ejercer los derechos
              reconocidos por la Ley 25.326.
            </p>

            {/* ── 8 ── */}
            <h2>8. Disponibilidad del Servicio</h2>
            <p>
              La Empresa realizará sus mejores esfuerzos para mantener la Plataforma disponible de
              manera continua; sin embargo, no garantiza una disponibilidad ininterrumpida ni libre
              de errores. La Empresa podrá suspender el Servicio temporalmente por mantenimiento,
              actualizaciones o causas de fuerza mayor, sin que ello genere derecho a compensación
              alguna.
            </p>

            {/* ── 9 ── */}
            <h2>9. Modificación de los Términos</h2>
            <p>
              La Empresa se reserva el derecho de modificar los presentes Términos en cualquier
              momento. Las modificaciones serán notificadas al Usuario mediante correo electrónico
              o aviso en la Plataforma con al menos quince (15) días de anticipación. El uso
              continuado del Servicio tras dicho plazo implicará la aceptación de los nuevos Términos.
            </p>

            {/* ── 10 ── */}
            <h2>10. Rescisión</h2>
            <p>
              El Usuario podrá dar de baja su cuenta en cualquier momento desde la configuración de
              la Plataforma. La Empresa podrá rescindir o suspender el acceso del Usuario en caso
              de incumplimiento de estos Términos, con o sin aviso previo, sin responsabilidad de
              su parte.
            </p>

            {/* ── 11 ── */}
            <h2>11. Ley Aplicable y Jurisdicción</h2>
            <p>
              Los presentes Términos se rigen por las leyes de la República Argentina. Para
              cualquier controversia derivada de su interpretación o ejecución, las partes se
              someten a la competencia de los Tribunales Ordinarios en lo Civil y Comercial de la
              Ciudad de Buenos Aires, con renuncia expresa a cualquier otro fuero o jurisdicción
              que pudiera corresponderles.
            </p>

            {/* ── 12 ── */}
            <h2>12. Contacto</h2>
            <p>
              Para consultas relacionadas con estos Términos, puede comunicarse con nosotros a
              través de{" "}
              <a href="mailto:soporte@doculex.com.ar" className="text-primary hover:underline">
                soporte@doculex.com.ar
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
