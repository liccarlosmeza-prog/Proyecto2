from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = 'Entrega_Scrum_Mi_Comunidad_Los_Robles.docx'
BLUE, NAVY, GOLD, PALE = '2E74B5', '12394A', 'E2A343', 'E8EEF5'

def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), color); tcPr.append(shd)
def border_bottom(paragraph, color=NAVY):
    pPr = paragraph._p.get_or_add_pPr(); borders = OxmlElement('w:pBdr'); bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),'single'); bottom.set(qn('w:sz'),'10'); bottom.set(qn('w:space'),'8'); bottom.set(qn('w:color'),color); borders.append(bottom); pPr.append(borders)
def set_font(run, size=11, bold=None, color=None):
    run.font.name = 'Calibri'; run._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); run._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); run.font.size = Pt(size)
    if bold is not None: run.bold=bold
    if color: run.font.color.rgb = RGBColor.from_string(color)
def add_p(doc, text='', size=11, bold=False, color=None, after=6, before=0, align=None):
    p = doc.add_paragraph(); p.paragraph_format.space_before=Pt(before); p.paragraph_format.space_after=Pt(after); p.paragraph_format.line_spacing=1.1
    if align: p.alignment=align
    r=p.add_run(text); set_font(r,size,bold,color); return p
def heading(doc, text, level=1):
    p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(16 if level==1 else 12); p.paragraph_format.space_after=Pt(7 if level==1 else 5)
    r=p.add_run(text); set_font(r,16 if level==1 else 13,True,BLUE); return p
def table(doc, headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'; t.autofit=False
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; shade(c,PALE); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(3); r=p.add_run(h); set_font(r,9,True,NAVY)
        if widths: c.width=Inches(widths[i])
    for row in rows:
        cells=t.add_row().cells
        for i,value in enumerate(row):
            cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if widths: cells[i].width=Inches(widths[i])
            p=cells[i].paragraphs[0]; p.paragraph_format.space_after=Pt(3); r=p.add_run(str(value)); set_font(r,8.7)
    for row in t.rows:
        for c in row.cells:
            tc=c._tc; tcPr=tc.get_or_add_tcPr(); tcMar=OxmlElement('w:tcMar')
            for side in ('top','start','bottom','end'):
                el=OxmlElement(f'w:{side}'); el.set(qn('w:w'),'90'); el.set(qn('w:type'),'dxa'); tcMar.append(el)
            tcPr.append(tcMar)
    return t

doc=Document()
sec=doc.sections[0]; sec.top_margin=Inches(0.8); sec.bottom_margin=Inches(0.8); sec.left_margin=Inches(0.85); sec.right_margin=Inches(0.85)
styles=doc.styles
styles['Normal'].font.name='Calibri'; styles['Normal']._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); styles['Normal'].font.size=Pt(11)
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; footer.add_run('Plataforma Mi Comunidad "Los Robles" | Entrega Scrum')
for run in footer.runs: set_font(run,8,False,'71807E')

add_p(doc,'DOCUMENTACIÓN DEL PROYECTO',11,True,GOLD,after=10)
title=add_p(doc,'Plataforma Mi Comunidad\n"Los Robles"',27,True,NAVY,after=8)
add_p(doc,'Desarrollo Scrum y entrega del Sprint 1',15,False,'496762',after=24)
rule=doc.add_paragraph(); border_bottom(rule)
add_p(doc,'Elaborado por: José Carlos Meza López',11,True,NAVY,after=4,before=18)
add_p(doc,'Producto: Aplicación React para la gestión comunitaria',11,False,'526B68',after=4)
add_p(doc,'Fecha: 30 de agosto de 2026',11,False,'526B68',after=22)
add_p(doc,'Propósito',15,True,BLUE,after=6)
add_p(doc,'Este documento integra el acceso al repositorio, el Product Backlog, las fichas de historias, la planificación del Sprint 1 y la calendarización de los sprints del proyecto.',11,False,None,after=12)
add_p(doc,'Acceso de GitHub',15,True,BLUE,after=6)
add_p(doc,'https://github.com/TU-USUARIO/mi-comunidad-los-robles',11,True,NAVY,after=4)
add_p(doc,'Nota: sustituir TU-USUARIO por el nombre de la cuenta al crear y publicar el repositorio.',9,False,'71807E',after=0)

heading(doc,'1. Visión del producto')
add_p(doc,'Centralizar la información operativa de la comunidad para mejorar la comunicación, la transparencia financiera, el mantenimiento y la consulta segura de documentos.',11)
heading(doc,'2. Product Backlog')
backlog=[
('ROBLES-PB-01','Padrón, usuarios y acceso','Máxima','Sprint 1','6 PH / $5,000'),('ROBLES-PB-02','Conciliación y control de pagos','Máxima','Sprint 2','8 PH / $34,000'),('ROBLES-PB-03','Auditoría y seguridad','Alta','Sprint 2','3 PH / $10,000'),('ROBLES-PB-04','Centro de notificaciones','Alta','Sprint 3','5 PH / $14,000'),('ROBLES-PB-05','Actas de asamblea','Media','Sprint 4','5 PH / $12,000'),('ROBLES-PB-06','Gestor de mantenimiento','Media','Sprint 5','5 PH / $17,000'),('ROBLES-PB-07','Directorio interactivo','Media','Sprint 5','3 PH / $7,000'),('ROBLES-PB-08','Reportes e indicadores','Baja','Sprint 6','3 PH / $6,000')]
table(doc,['ID','Historia / alias','Prioridad','Sprint','Estimación / costo'],backlog,[1.0,2.4,.75,.75,1.1])

heading(doc,'3. Fichas de Backlog')
stories=[
('ROBLES-PB-01 — Padrón, usuarios y acceso','Como Mesa Directiva, quiero registrar viviendas, residentes, roles y consentimiento de privacidad, para que cada persona consulte únicamente la información y funciones autorizadas.','Máxima | Sprint 1 | 6 puntos / 80 horas','Vivienda y usuario relacionados; roles aplicados; registro bloqueado sin consentimiento; datos disponibles para los demás módulos.'),
('ROBLES-PB-02 — Conciliación y control de pagos','Como responsable de Tesorería, quiero importar movimientos y registrar pagos conciliados contra el padrón, para actualizar saldos y disminuir la morosidad.','Máxima | Sprint 2 | 8 puntos / 208 horas','SPEI conciliado, recibo de efectivo, saldos actualizados y excepciones identificadas.'),
('ROBLES-PB-03 — Auditoría y seguridad','Como auditor, quiero una bitácora inalterable de operaciones y cambios, para conservar trazabilidad y detectar cambios no autorizados.','Alta | Sprint 2 | 3 puntos','Registra usuario, acción, fecha, registro afectado y resultado; no editable desde la aplicación.'),
('ROBLES-PB-04 — Centro de notificaciones','Como integrante de Mesa Directiva, quiero publicar alertas segmentadas y consultar su lectura, para comunicar avisos oportunos.','Alta | Sprint 3 | 5 puntos','Recepción móvil, segmentación correcta y evidencia de lectura.'),
('ROBLES-PB-05 — Actas de asamblea','Como responsable de Secretaría, quiero generar, firmar y resguardar actas como documentos finales, para consultar acuerdos de forma permanente.','Media | Sprint 4 | 5 puntos','PDF firmado, disponible para consulta y bloqueado contra modificaciones.'),
('ROBLES-PB-06 — Gestor de mantenimiento','Como residente, quiero reportar fallas con evidencia fotográfica y consultar su estado, para dar seguimiento transparente.','Media | Sprint 5 | 5 puntos','Folio, foto comprimida, responsable, estado e historial.'),
('ROBLES-PB-07 — Directorio interactivo','Como residente, quiero consultar un directorio actualizado de contactos comunitarios y emergencia, para comunicarme rápidamente.','Media | Sprint 5 | 3 puntos','Datos autorizados y vigentes; botones de teléfono y correo operativos.'),
('ROBLES-PB-08 — Reportes e indicadores','Como Mesa Directiva, quiero visualizar indicadores de recaudación, morosidad y adopción, para tomar decisiones verificables.','Baja | Sprint 6 | 3 puntos','Totales conciliados, tasas calculadas y exportación para cierre.')]
for title,description,meta,criteria in stories:
    add_p(doc,title,12,True,NAVY,after=3,before=10)
    add_p(doc,description,10,False,None,after=3)
    add_p(doc,'Planificación: '+meta,9,True,'526B68',after=2)
    add_p(doc,'Criterios de aceptación: '+criteria,9,False,'526B68',after=3)

heading(doc,'4. Sprint Planning — Sprint 1')
add_p(doc,'Objetivo del Sprint: crear una base segura de datos de viviendas y residentes, con acceso por rol y consentimiento de privacidad.',11,True,NAVY)
table(doc,['Elemento de trabajo','Responsable','Estimación','Resultado esperado'],[
('Diseñar padrón de viviendas y residentes','Dev BD / Admin','16 h','Modelo con una vivienda y sus residentes'),('Registro y vinculación de usuarios','Dev Full Stack','16 h','Usuario relacionado con vivienda y contacto'),('Roles y permisos','Dev Backend','16 h','Cada rol ve solo funciones autorizadas'),('Aviso y consentimiento','Legal / Frontend','8 h','Registro bloqueado sin consentimiento'),('Administración de usuarios y viviendas','Frontend','16 h','Altas, cambios y bajas controlados'),('Pruebas de acceso y aceptación','QA / Administrador','8 h','Sin accesos indebidos; evidencia de consentimiento')],[2.3,1.35,.7,2.25])
add_p(doc,'Definition of Done: código integrado, criterios de aceptación aprobados, sin defectos críticos y documentación actualizada.',10,True,NAVY,after=8,before=8)
add_p(doc,'Entrega implementada en React',13,True,BLUE,after=5)
add_p(doc,'La aplicación contiene altas de viviendas, usuarios vinculados, asignación de roles, validación de datos duplicados, consentimiento obligatorio, almacenamiento local y un tablero del Sprint 1.',10)

heading(doc,'5. Calendarización de los Sprint')
add_p(doc,'Cadencia propuesta: 10 días hábiles por sprint. La fecha de inicio la define el equipo al comenzar el proyecto.',10)
table(doc,['Sprint','Duración','Historias','Resultado esperado'],[
('Sprint 1','Días 1–10','PB-01','Padrón, acceso, roles y privacidad'),('Sprint 2','Días 11–20','PB-02, PB-03','Pagos conciliados y bitácora de auditoría'),('Sprint 3','Días 21–30','PB-04','Alertas segmentadas y lectura registrada'),('Sprint 4','Días 31–40','PB-05','Actas firmadas y resguardadas'),('Sprint 5','Días 41–50','PB-06, PB-07','Mantenimiento y directorio operativo'),('Sprint 6','Días 51–60','PB-08','Indicadores, exportación y cierre')],[.85,1.1,1.2,3.45])
heading(doc,'6. Ceremonias Scrum')
for text in ['Sprint Planning: al inicio de cada sprint se revisa capacidad, objetivo y criterios de aceptación.','Daily Scrum: 15 minutos diarios para comunicar avance, impedimentos y siguiente acción.','Sprint Review: demostración del incremento al Product Owner y recepción de comentarios.','Retrospectiva: acuerdo de una mejora concreta para aplicar en el siguiente sprint.']:
    p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(4); r=p.add_run(text); set_font(r,10)
doc.save(OUT)
print(OUT)
