export const tables = {
  questionnaire_questions: ['id','question_order','question_kind','question_en','question_th','active','created_at'],
  questionnaire_choices: ['id','question_id','choice_order','label','choice_en','choice_th','score_b','score_d','score_s','score_m','special_action','special_url','feedback_en','feedback_th','active','created_at'],
  invitation_codes: ['id','room_key','code','active','created_at'],
  invitation_results: ['id','guest_name','guest_name_key','answered_date','answers','scores','winning_room','invitation_code','session_id','active_play_token','active_play_session_id','active_play_expires_at','created_at'],
  mini_game_scores: ['id','room_key','guest_name','click_count','session_id','created_at','updated_at'],
  site_events: ['id','event_name','session_id','created_at'],
};

export function sqlValue(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) throw new Error('Unsafe numeric value in export');
    return String(value);
  }
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (str.includes('\0')) throw new Error('NUL byte in export');
  return `'${str.replaceAll("'", "''")}'`;
}

export function convertRow(table, original, seenNames) {
  const row = { ...original };
  if (table === 'invitation_results') {
    const key = row.guest_name.trim().toLowerCase();
    seenNames.add(key);
    row.guest_name_key = key;
    // Force re-entry after cutover; never migrate live credentials into a SQL artifact.
    row.active_play_token = null;
    row.active_play_session_id = null;
    row.active_play_expires_at = null;
  }
  for (const key of ['created_at','updated_at']) {
    if (row[key] != null) row[key] = new Date(row[key]).toISOString();
  }
  const columns = tables[table];
  if (!columns) throw new Error('Unknown table');
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(key => sqlValue(row[key])).join(',')});\n`;
  if (Buffer.byteLength(sql) > 90_000) throw new Error('Row exceeds safe D1 SQL statement size; use bound batch import for this row');
  return { row, sql };
}
