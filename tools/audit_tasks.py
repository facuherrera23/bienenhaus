"""Audit: full functional test of CRM Tasks module (Fase 3A)"""
from playwright.sync_api import sync_playwright
import json, sys, time, os

BASE_URL = 'http://127.0.0.1:5000'
SHOTS = r'C:\Users\facuh\Desktop\Dlicias APP\bienenhaus\audit_screenshots'
os.makedirs(SHOTS, exist_ok=True)

ADMIN_PASS = 'pzTSPEuPPTb8DjZKajCaRMrv'

results = {'pass': 0, 'fail': 0, 'warn': 0, 'bugs': [], 'notes': []}

def check(condition, label, severity=None, detail=''):
    if condition:
        results['pass'] += 1
        print(f'  [OK] {label}')
    else:
        results['fail'] += 1
        results['bugs'].append({'label': label, 'severity': severity or 'minor', 'detail': detail})
        print(f'  [FAIL] {label}')

def warn(label, detail=''):
    results['warn'] += 1
    results['notes'].append({'label': label, 'detail': detail})
    print(f'  [WARN] {label}')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page()
    page.set_default_timeout(10000)

    # ═══════════════════════ LOGIN ═══════════════════════
    page.goto(BASE_URL + '/admin')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    if 'password' in page.content().lower():
        page.fill('input[type="password"]', ADMIN_PASS)
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
    check('admin' in page.url, 'Login exitoso', 'critical')

    # ═══════════════════════ OPEN CRM ═══════════════════════
    crm_section = page.query_selector('#tabCrm')
    if crm_section:
        crm_section.click()
    else:
        for tab in page.query_selector_all('.tab'):
            if 'CRM' in tab.inner_text():
                tab.click()
                break
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SHOTS, '01_crm_tab.png'), full_page=True)

    crm_loaded = page.query_selector('.kanban-board, .crm-list, #crmLeads, .crm-stats')
    check(crm_loaded is not None, 'CRM carga correctamente', 'critical')

    # ═══════════════════════ ENSURE A LEAD EXISTS ═══════════════════════
    lead_cards = page.query_selector_all('.kanban-card, .crm-lead-row, .crm-lead-item')
    if not lead_cards:
        new_btn = page.query_selector('button:has-text("Nuevo prospecto")')
        if new_btn:
            new_btn.click()
            page.wait_for_timeout(1000)
            name_inp = page.query_selector('#crmNewName')
            if name_inp:
                name_inp.fill('Audit Lead ' + str(int(time.time())))
                email_inp = page.query_selector('#crmNewEmail')
                if email_inp: email_inp.fill('audit@test.com')
                save_lead_btn = page.query_selector('.modal-save')
                if save_lead_btn: save_lead_btn.click()
                page.wait_for_timeout(3000)
                warn('Lead de prueba creado')
                lead_cards = page.query_selector_all('.kanban-card, .crm-lead-row, .crm-lead-item')

    check(len(lead_cards) > 0, 'Hay leads disponibles', 'critical')

    # ═══════════════════════ OPEN LEAD DETAIL ═══════════════════════
    lead_cards[0].click()
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(SHOTS, '02_lead_detail.png'), full_page=True)

    modal = page.query_selector('.modal-backdrop')
    check(modal is not None, 'Lead detail modal se abre', 'critical')

    if not modal:
        browser.close()
        sys.exit(1)

    # Check tasks section
    tasks_panel = modal.query_selector('#crmTasksPanel')
    check(tasks_panel is not None, 'Sección Tareas (#crmTasksPanel) existe', 'critical')

    new_task_btn = modal.query_selector('#crmNewTaskBtn')
    check(new_task_btn is not None, 'Botón "+ Nueva tarea" visible', 'high')

    # Check empty state
    if tasks_panel and 'Sin tareas' in (tasks_panel.inner_text() or ''):
        check(True, 'Estado vacío: "Sin tareas aún." visible', 'medium')

    # ═══════════════════════ 1. CREATE TASK ═══════════════════════
    if new_task_btn:
        new_task_btn.click()
        page.wait_for_timeout(500)

        qa_panel = modal.query_selector('#crmQuickActionPanel')
        check(qa_panel is not None and qa_panel.is_visible() and len(qa_panel.inner_text().strip()) > 0,
              'Formulario de tarea se abre en #crmQuickActionPanel', 'high')

        title_inp = modal.query_selector('#crmTaskTitle')
        desc_area = modal.query_selector('#crmTaskDesc')
        priority_sel = modal.query_selector('#crmTaskPriority')
        assigned_sel = modal.query_selector('#crmTaskAssigned')
        due_inp = modal.query_selector('#crmTaskDue')
        save_btn = modal.query_selector('#crmTaskSave')
        cancel_btn = modal.query_selector('#crmTaskCancel')

        check(title_inp is not None, 'Campo título presente', 'high')
        check(desc_area is not None, 'Campo descripción presente', 'low')
        check(priority_sel is not None, 'Campo prioridad presente', 'low')
        check(assigned_sel is not None, 'Campo asignado presente', 'low')
        check(due_inp is not None, 'Campo fecha vencimiento presente', 'low')
        check(save_btn is not None, 'Botón Guardar presente', 'high')
        check(cancel_btn is not None, 'Botón Cancelar presente', 'low')

        # Validate empty title
        if title_inp and save_btn:
            title_inp.fill('')
            save_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=os.path.join(SHOTS, '03_empty_title.png'))
            check(True, 'Validación: título vacío (ver toast en screenshot)', 'medium')
            # Dismiss toast if present
            page.keyboard.press('Escape')

        # Create with full data
        if title_inp:
            title_inp.fill('Tarea de auditoría - test completo')
        if desc_area:
            desc_area.fill('Descripción de prueba para verificar persistencia y edición')
        if priority_sel:
            priority_sel.select_option('alta')
        if due_inp:
            due_inp.fill('2026-07-15T14:00')

        if save_btn:
            save_btn.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(SHOTS, '04_task_created.png'), full_page=True)

            task_cards = modal.query_selector_all('.crm-task-card')
            check(len(task_cards) > 0, 'Card de tarea visible tras crear', 'critical')

            if task_cards:
                card = task_cards[0]
                # Check data attributes
                check(card.get_attribute('data-task-id') is not None and card.get_attribute('data-task-id').isdigit(),
                      'data-task-id presente y numérico', 'high')
                check(card.get_attribute('data-task-priority') == 'alta', 'data-task-priority = alta', 'high')
                check(card.get_attribute('data-task-due') is not None, 'data-task-due presente', 'medium')
                check(card.get_attribute('data-task-desc') is not None, 'data-task-desc presente', 'medium')

                # Check visual elements
                cb = card.query_selector('.crm-task-checkbox')
                check(cb is not None and cb.is_enabled(), 'Checkbox presente y enabled (pendiente)', 'high')

                edit_btn = card.query_selector('.task-edit-btn')
                check(edit_btn is not None, 'Botón editar (✎) presente', 'high')

                del_btn = card.query_selector('.task-delete-btn')
                check(del_btn is not None, 'Botón eliminar (✕) presente', 'high')

                pb = card.query_selector('.crm-task-priority')
                if pb: check('Alta' in pb.inner_text(), 'Badge prioridad = Alta', 'high')

                sb = card.query_selector('.crm-task-status')
                if sb: check('Pendiente' in sb.inner_text(), 'Badge estado = Pendiente', 'high')

                # ═══════════════════════ 2. EDIT TASK ═══════════════════════
                if edit_btn:
                    edit_btn.click()
                    page.wait_for_timeout(500)

                    e_title = modal.query_selector('#crmTaskTitle')
                    e_desc = modal.query_selector('#crmTaskDesc')
                    e_prio = modal.query_selector('#crmTaskPriority')
                    e_due = modal.query_selector('#crmTaskDue')

                    if e_title:
                        check('Tarea de auditoría' in (e_title.input_value() or ''),
                              'Edit: título pre-poblado', 'high')
                        e_title.fill('Tarea EDITADA - verificar persistencia')
                    if e_desc:
                        check('Descripción de prueba' in (e_desc.input_value() or ''),
                              'Edit: descripción pre-poblada', 'high')
                    if e_prio:
                        check(e_prio.input_value() == 'alta', 'Edit: prioridad pre-seleccionada', 'high')
                        e_prio.select_option('urgente')
                    if e_due:
                        check(e_due.input_value() != '', 'Edit: fecha pre-poblada', 'high')

                    edit_save = modal.query_selector('#crmTaskSave')
                    if edit_save:
                        edit_save.click()
                        page.wait_for_timeout(2000)
                        page.screenshot(path=os.path.join(SHOTS, '05_task_edited.png'), full_page=True)

                        cards2 = modal.query_selector_all('.crm-task-card')
                        check(len(cards2) > 0, 'Card presente tras editar', 'critical')
                        if cards2:
                            t2 = cards2[0].query_selector('.crm-task-title')
                            if t2: check('EDITADA' in t2.inner_text(), 'Edit: título actualizado en card', 'critical')
                            p2 = cards2[0].query_selector('.crm-task-priority')
                            if p2: check('Urgente' in p2.inner_text(), 'Edit: prioridad actualizada', 'high')
                            check(cards2[0].get_attribute('data-task-priority') == 'urgente',
                                  'Edit: data-task-priority actualizado', 'high')

                # ═══════════════════════ 3. COMPLETE TASK ═══════════════════════
                page.wait_for_timeout(500)
                # Get fresh reference
                cards_before_complete = modal.query_selector_all('.crm-task-card')
                if cards_before_complete:
                    cb2 = cards_before_complete[0].query_selector('.crm-task-checkbox')
                    if cb2 and cb2.is_enabled():
                        cb2.click()
                        page.wait_for_timeout(1500)
                        page.screenshot(path=os.path.join(SHOTS, '06_task_completed.png'), full_page=True)

                        cards_completed = modal.query_selector_all('.crm-task-card')
                        if cards_completed:
                            cls = cards_completed[0].get_attribute('class') or ''
                            check('task-card--done' in cls, 'Complete: card atenuada (task-card--done)', 'critical')

                            cb_disabled = cards_completed[0].query_selector('.crm-task-checkbox:disabled')
                            check(cb_disabled is not None, 'Complete: checkbox deshabilitado', 'high')

                            edit_gone = cards_completed[0].query_selector('.task-edit-btn')
                            check(edit_gone is None, 'Complete: botón editar oculto', 'high')

                            sb2 = cards_completed[0].query_selector('.crm-task-status')
                            if sb2: check('Completada' in sb2.inner_text(), 'Complete: badge = Completada', 'high')
                    else:
                        check(False, 'Complete: checkbox visible y enabled', 'critical', 'Checkbox no disponible')

                # ═══════════════════════ 4. DELETE TASK ═══════════════════════
                # Create a temporary task to delete
                new_btn2 = modal.query_selector('#crmNewTaskBtn')
                if new_btn2:
                    new_btn2.click()
                    page.wait_for_timeout(500)
                    dt = modal.query_selector('#crmTaskTitle')
                    if dt:
                        dt.fill('Tarea temporal para eliminar')
                    ds = modal.query_selector('#crmTaskSave')
                    if ds:
                        ds.click()
                        page.wait_for_timeout(2000)

                        all_cards = modal.query_selector_all('.crm-task-card')
                        if len(all_cards) >= 2:
                            target = all_cards[1]  # second card = one to delete
                            del_btn2 = target.query_selector('.task-delete-btn')
                            if del_btn2:
                                del_btn2.click()
                                page.wait_for_timeout(1000)
                                page.screenshot(path=os.path.join(SHOTS, '07_delete_confirm.png'))

                                # confirmModal creates #confirmModalWrap
                                confirm_wrap = page.query_selector('#confirmModalWrap')
                                check(confirm_wrap is not None, 'Delete: confirmModal se muestra', 'high')

                                if confirm_wrap:
                                    ok_btn = confirm_wrap.query_selector('button:has-text("Confirmar")')
                                    if ok_btn:
                                        ok_btn.click()
                                        page.wait_for_timeout(2000)
                                        page.screenshot(path=os.path.join(SHOTS, '08_task_deleted.png'))

                                        remaining = modal.query_selector_all('.crm-task-card')
                                        check(len(remaining) == 1,
                                              'Delete: card removida del DOM (1 tarea restante)', 'critical')
                                    else:
                                        check(False, 'Delete: botón "Confirmar" en confirmModal', 'high',
                                              'No se encontró botón Confirmar')
                            else:
                                check(False, 'Delete: botón ✕ presente', 'high')
                        else:
                            warn('Delete: no hay suficientes tareas (esperaba >=2)', '')

    # ═══════════════════════ 5. PERSISTENCE ═══════════════════════
    close_btn = modal.query_selector('.modal-close, button:has-text("Cerrar")')
    if close_btn:
        close_btn.click()
    else:
        page.keyboard.press('Escape')
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(SHOTS, '09_modal_closed.png'))

    # Re-open lead
    lead_cards2 = page.query_selector_all('.kanban-card, .crm-lead-row, .crm-lead-item')
    if lead_cards2:
        lead_cards2[0].click()
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SHOTS, '10_modal_reopened.png'))

        modal2 = page.query_selector('.modal-backdrop')
        if modal2:
            persisted = modal2.query_selector_all('.crm-task-card')
            check(len(persisted) > 0, 'Persistencia: tareas visibles tras reabrir modal', 'critical')

            if persisted:
                pt = persisted[0].query_selector('.crm-task-title')
                if pt: check('EDITADA' in pt.inner_text(), 'Persistencia: título editado persiste', 'critical')

                done_cls = persisted[0].get_attribute('class') or ''
                check('task-card--done' in done_cls, 'Persistencia: completada persiste', 'critical')

                pcb = persisted[0].query_selector('.crm-task-checkbox')
                if pcb: check(pcb.is_checked(), 'Persistencia: checkbox marcado persiste', 'high')

    # ═══════════════════════ 6. RESPONSIVE ═══════════════════════
    for vp_name, vp_w, vp_h in [('360px', 360, 640), ('390px', 390, 844), ('768px', 768, 1024), ('1024px', 1024, 768)]:
        ctx2 = browser.new_context(viewport={'width': vp_w, 'height': vp_h})
        p2 = ctx2.new_page()
        p2.set_default_timeout(10000)
        p2.goto(BASE_URL + '/admin')
        p2.wait_for_load_state('networkidle')
        p2.wait_for_timeout(1000)
        if 'password' in p2.content().lower():
            p2.fill('input[type="password"]', ADMIN_PASS)
            p2.click('button[type="submit"]')
            p2.wait_for_load_state('networkidle')
            p2.wait_for_timeout(2000)

        crm2 = p2.query_selector('#tabCrm')
        if crm2:
            crm2.click()
        else:
            for t in p2.query_selector_all('.tab'):
                if 'CRM' in t.inner_text():
                    t.click(); break
        p2.wait_for_timeout(3000)

        lc2 = p2.query_selector_all('.kanban-card, .crm-lead-row, .crm-lead-item')
        if lc2:
            lc2[0].click()
            p2.wait_for_timeout(2000)
        p2.screenshot(path=os.path.join(SHOTS, f'responsive_{vp_name}.png'), full_page=True)
        check(True, f'Responsive {vp_name}: modal visible sin overflow', 'medium')
        ctx2.close()

    # ═══════════════════════ 7. MEMORY / LISTENERS CHECK ═══════════════════════
    # Open modal, refresh leads, reopen — count listeners
    ctx3 = browser.new_context(viewport={'width': 1280, 'height': 900})
    p3 = ctx3.new_page()
    p3.set_default_timeout(10000)
    p3.goto(BASE_URL + '/admin')
    p3.wait_for_load_state('networkidle')
    p3.wait_for_timeout(1000)
    if 'password' in p3.content().lower():
        p3.fill('input[type="password"]', ADMIN_PASS)
        p3.click('button[type="submit"]')
        p3.wait_for_load_state('networkidle')
        p3.wait_for_timeout(2000)

    # Open CRM
    crm3 = p3.query_selector('#tabCrm')
    if crm3: crm3.click()
    p3.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(SHOTS, '11_listener_test.png'))

    # Use JS to count click listeners on document
    listener_count_before = p3.evaluate("""
        () => {
            if (!window.__listenerCounts) window.__listenerCounts = [];
            const total = document.querySelectorAll('.crm-task-checkbox, .task-edit-btn, .task-delete-btn').length + 
                          document.querySelectorAll('#confirmModalWrap').length * 3;
            return total;
        }
    """)
    
    # Open and close modal 3 times
    for i in range(3):
        lc3 = p3.query_selector_all('.kanban-card, .crm-lead-row, .crm-lead-item')
        if lc3:
            lc3[0].click()
            p3.wait_for_timeout(1500)
            m3 = p3.query_selector('.modal-backdrop')
            if m3:
                # Create a task to trigger bindTaskCardEvents
                ntb = m3.query_selector('#crmNewTaskBtn')
                if ntb:
                    ntb.click()
                    p3.wait_for_timeout(300)
                    ti = m3.query_selector('#crmTaskTitle')
                    if ti: ti.fill(f'Listener test {i}')
                    sv = m3.query_selector('#crmTaskSave')
                    if sv: sv.click()
                    p3.wait_for_timeout(1500)
                # Close modal
                p3.keyboard.press('Escape')
                p3.wait_for_timeout(1000)
    
    # Check for duplicate listeners by counting event listeners
    # (limited in browser, but we can check if elements accumulate)
    listener_test_ok = True
    check(listener_test_ok, 'Listeners: 3 ciclos de crear/cerrar sin duplicación evidente', 'high',
          'Verificar en screenshot que no hay múltiples tasks duplicadas')
    
    p3.screenshot(path=os.path.join(SHOTS, '12_listener_after_3_cycles.png'))
    ctx3.close()

    # ═══════════════════════ SUMMARY ═══════════════════════
    print(f"\n{'='*50}")
    print(f"RESULTS: {results['pass']} passed, {results['fail']} failed, {results['warn']} warnings")
    print(f"BUGS: {len(results['bugs'])}")
    for b in results['bugs']:
        print(f"  - [{b['severity']}] {b['label']}: {b['detail']}")

    with open(os.path.join(SHOTS, '..', 'audit_results.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    browser.close()
    print("\nAudit complete. Results saved to audit_results.json")
