import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad | DocuLex",
  description:
    "Política de Privacidad de DocuLex conforme a la Ley N.º 25.326 de Protección de Datos Personales de la República Argentina.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://doculex.com.ar/privacidad" },
};

const LAST_UPDATED = "7 de abril de 2025";

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white dark:bg-background-dark">
        {/* Hero */}
        <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-primary font-semibold uppercase tracking-wide mb-3">
              DocuLex · Documento Legal
            </p>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Política de Privacidad
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
              La presente Política de Privacidad (en adelante, «la Política») describe cómo{" "}
              <strong>DocuLex S.R.L.</strong> (en adelante, «la Empresa», «nosotros») recopila,
              utiliza, almacena y protege los datos personales de los usuarios (en adelante,
              «el Usuario», «usted») de la plataforma <strong>DocuLex</strong>.
            </p>
            <p>
              Esta Política se rige por la{" "}
              <strong>Ley N.º 25.326 de Protección de Datos Personales</strong> de la República
              Argentina, su Decreto Reglamentario N.º 1558/2001 y las disposiciones complementarias
              de la{" "}
              <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>.
            </p>
            <p className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
              <strong>Aviso legal:</strong> El titular de los datos personales tiene la facultad de
              ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores
              a seis (6) meses, salvo que se acredite un interés legítimo al efecto, conforme lo
              establecido en el artículo 14, inciso 3 de la Ley N.º 25.326. La AAIP, en su carácter
              de Órgano de Control de la Ley N.º 25.326, tiene la atribución de atender las
              denuncias y reclamos que se interpongan con relación al incumplimiento de las normas
              sobre protección de datos personales.
            </p>

            {/* ── 1 ── */}
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales es:
            </p>
            <ul>
              <li><strong>Denominación:</strong> DocuLex S.R.L.</li>
              <li><strong>Domicilio:</strong> República Argentina</li>
              <li>
                <strong>Correo electrónico:</strong>{" "}
                <a href="mailto:privacidad@doculex.com.ar" className="text-primary hover:underline">
                  privacidad@doculex.com.ar
                </a>
              </li>
            </ul>

            {/* ── 2 ── */}
            <h2>2. Datos que Recopilamos</h2>
            <h3>2.1 Datos de registro</h3>
            <p>
              Al crear una cuenta, recopilamos: nombre y apellido, dirección de correo electrónico,
              nombre del estudio o empresa (opcional), y contraseña (almacenada en forma cifrada).
            </p>
            <h3>2.2 Datos de uso del Servicio</h3>
            <p>
              Durante el uso de la Plataforma, podemos recopilar: datos ingresados en formularios
              de generación de documentos (partes, fechas, montos, condiciones), historial de
              documentos generados, interacciones con el asistente de IA, registros de acceso
              (fecha, hora, dirección IP, tipo de dispositivo y navegador).
            </p>
            <h3>2.3 Datos de pago</h3>
            <p>
              Los datos de medios de pago son procesados directamente por nuestros proveedores
              de pagos certificados (PCI DSS). La Empresa no almacena números de tarjeta ni
              datos sensibles de pago.
            </p>
            <h3>2.4 Datos de terceros</h3>
            <p>
              Si el Usuario ingresa datos de terceros (clientes, contrapartes) en la Plataforma
              para la generación de documentos, es responsabilidad del Usuario haber obtenido
              el consentimiento correspondiente conforme a la normativa aplicable.
            </p>

            {/* ── 3 ── */}
            <h2>3. Finalidades del Tratamiento</h2>
            <p>Los datos recopilados se utilizan para:</p>
            <ul>
              <li>Crear y gestionar la cuenta del Usuario y prestar el Servicio contratado.</li>
              <li>Procesar pagos y gestionar suscripciones.</li>
              <li>Mejorar y optimizar los modelos de inteligencia artificial y la calidad del Servicio.</li>
              <li>Enviar comunicaciones relacionadas con el Servicio (actualizaciones, alertas de seguridad, cambios en los Términos).</li>
              <li>Enviar comunicaciones comerciales y de marketing, únicamente con consentimiento previo del Usuario.</li>
              <li>Cumplir con obligaciones legales y regulatorias.</li>
              <li>Prevenir fraudes y garantizar la seguridad de la Plataforma.</li>
            </ul>

            {/* ── 4 ── */}
            <h2>4. Base Legal del Tratamiento</h2>
            <p>El tratamiento de datos personales se fundamenta en:</p>
            <ul>
              <li>
                <strong>Ejecución contractual:</strong> para la prestación del Servicio conforme
                a los{" "}
                <Link href="/terminos" className="text-primary hover:underline">
                  Términos y Condiciones
                </Link>
                .
              </li>
              <li>
                <strong>Interés legítimo:</strong> para mejorar el Servicio, prevenir fraudes y
                garantizar la seguridad de la Plataforma.
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> cuando el tratamiento sea necesario para
                cumplir obligaciones legales aplicables.
              </li>
              <li>
                <strong>Consentimiento:</strong> para el envío de comunicaciones comerciales y
                el uso de cookies no esenciales.
              </li>
            </ul>

            {/* ── 5 ── */}
            <h2>5. Conservación de los Datos</h2>
            <p>
              Los datos personales se conservan durante el tiempo que la cuenta del Usuario
              permanezca activa y mientras sea necesario para los fines indicados en esta Política.
              Tras la baja de la cuenta, los datos se conservan por un período de hasta cinco (5)
              años a los efectos de cumplimiento legal, prevención de fraudes y resolución de
              disputas, salvo que el Usuario ejerza su derecho de supresión conforme a lo indicado
              en la Sección 7.
            </p>

            {/* ── 6 ── */}
            <h2>6. Transferencia y Compartición de Datos</h2>
            <p>
              La Empresa no vende ni cede datos personales a terceros con fines comerciales
              propios. Los datos podrán ser compartidos con:
            </p>
            <ul>
              <li>
                <strong>Proveedores de servicios tecnológicos:</strong> como proveedores de
                infraestructura en la nube, procesadores de pagos y servicios de IA, que actúan
                como encargados del tratamiento bajo contratos de confidencialidad.
              </li>
              <li>
                <strong>Autoridades públicas:</strong> cuando sea requerido por ley, orden judicial
                o autoridad competente.
              </li>
            </ul>
            <p>
              En caso de transferencias internacionales de datos, la Empresa adoptará las
              salvaguardas adecuadas conforme a la normativa argentina aplicable.
            </p>

            {/* ── 7 ── */}
            <h2>7. Derechos del Titular de los Datos</h2>
            <p>
              Conforme a la Ley N.º 25.326, el Usuario tiene derecho a:
            </p>
            <ul>
              <li>
                <strong>Acceso (art. 14):</strong> solicitar información sobre sus datos personales
                tratados por la Empresa, gratuitamente, con una periodicidad mínima de seis (6)
                meses, salvo interés legítimo acreditado.
              </li>
              <li>
                <strong>Rectificación (art. 16):</strong> solicitar la corrección de datos
                inexactos, incompletos o desactualizados.
              </li>
              <li>
                <strong>Supresión (art. 16):</strong> solicitar la eliminación de sus datos
                cuando resulten innecesarios para la finalidad para la que fueron recopilados,
                salvo obligación legal de conservación.
              </li>
              <li>
                <strong>Confidencialidad (art. 16):</strong> solicitar que sus datos no sean
                cedidos a terceros.
              </li>
              <li>
                <strong>Oposición (art. 27):</strong> oponerse al tratamiento de sus datos para
                fines de publicidad o marketing.
              </li>
            </ul>
            <p>
              Para ejercer estos derechos, el Usuario deberá enviar una solicitud por escrito a{" "}
              <a href="mailto:privacidad@doculex.com.ar" className="text-primary hover:underline">
                privacidad@doculex.com.ar
              </a>
              , indicando nombre completo, correo electrónico de la cuenta y descripción del
              derecho que desea ejercer. La Empresa responderá dentro de los cinco (5) días hábiles
              siguientes a la recepción de la solicitud.
            </p>

            {/* ── 8 ── */}
            <h2>8. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              La Plataforma utiliza cookies y tecnologías similares para:
            </p>
            <ul>
              <li>Mantener la sesión del Usuario autenticado.</li>
              <li>Recordar preferencias del Usuario.</li>
              <li>Analizar el uso de la Plataforma y mejorar la experiencia (cookies analíticas).</li>
            </ul>
            <p>
              Las cookies estrictamente necesarias no requieren consentimiento. Para las cookies
              analíticas, el Usuario puede gestionar sus preferencias desde la configuración de
              su navegador. La desactivación de ciertas cookies puede afectar la funcionalidad
              de la Plataforma.
            </p>

            {/* ── 9 ── */}
            <h2>9. Seguridad</h2>
            <p>
              La Empresa implementa medidas técnicas y organizativas adecuadas para proteger los
              datos personales contra acceso no autorizado, pérdida, alteración o destrucción,
              incluyendo cifrado en tránsito (TLS) y en reposo, controles de acceso basados en
              roles, monitoreo de seguridad y copias de seguridad periódicas.
            </p>
            <p>
              En caso de brecha de seguridad que afecte datos personales, la Empresa notificará
              a los Usuarios afectados y a la AAIP en los plazos y formas previstos por la
              normativa vigente.
            </p>

            {/* ── 10 ── */}
            <h2>10. Menores de Edad</h2>
            <p>
              El Servicio no está dirigido a menores de dieciocho (18) años. La Empresa no
              recopila intencionalmente datos personales de menores. Si se detectara que se han
              recopilado datos de un menor, se procederá a su eliminación inmediata.
            </p>

            {/* ── 11 ── */}
            <h2>11. Modificaciones a esta Política</h2>
            <p>
              La Empresa podrá modificar esta Política en cualquier momento. Las modificaciones
              serán notificadas al Usuario mediante correo electrónico o aviso en la Plataforma.
              El uso continuado del Servicio tras la notificación implicará la aceptación de la
              Política actualizada.
            </p>

            {/* ── 12 ── */}
            <h2>12. Contacto y Reclamos</h2>
            <p>
              Para cualquier consulta, ejercicio de derechos o reclamo relacionado con esta
              Política, puede comunicarse con nosotros:
            </p>
            <ul>
              <li>
                <strong>Correo electrónico:</strong>{" "}
                <a href="mailto:privacidad@doculex.com.ar" className="text-primary hover:underline">
                  privacidad@doculex.com.ar
                </a>
              </li>
            </ul>
            <p>
              Asimismo, el Usuario tiene derecho a presentar una denuncia o reclamo ante la{" "}
              <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, sita en Av.
              Pte. Gral. Julio A. Roca 710, Piso 2°, Ciudad Autónoma de Buenos Aires, o a través
              del sitio{" "}
              <a
                href="https://www.argentina.gob.ar/aaip"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.argentina.gob.ar/aaip
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
