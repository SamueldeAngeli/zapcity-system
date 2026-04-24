const fivemConfig = require('../../config/fivem');
const { registerLog, createKillLogMessage } = require('../../fivem/services/logsService');
const { isPoolReady } = require('../../database/mysql');

function health(req, res) {
  res.json({
    ok: true,
    databaseReady: isPoolReady(),
    timestamp: Date.now(),
  });
}

async function receiveFiveMLog(req, res) {
  if (!isPoolReady()) {
    return res.status(503).json({ ok: false, error: 'Banco indisponível.' });
  }

  const token = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token !== fivemConfig.apiSharedToken) {
    return res.status(401).json({ ok: false, error: 'Não autorizado.' });
  }

  const payload = req.body || {};
  const category = payload.type || 'general';

  if (category === 'kill') {
    await registerLog({
      category: 'kill',
      action: 'player_kill',
      title: 'Log de kill',
      actorPassport: payload.killerPassport || null,
      targetPassport: payload.victimPassport || null,
      passport: payload.victimPassport || null,
      message: createKillLogMessage(payload),
      fields: [
        { name: 'Vítima', value: `${payload.victimName || 'Desconhecido'} | ID ${payload.victimPassport || '-'}`, inline: true },
        { name: 'Assassino', value: `${payload.killerName || 'Desconhecido'} | ID ${payload.killerPassport || '-'}`, inline: true },
        { name: 'Arma', value: payload.weapon || 'N/D', inline: true },
        { name: 'Local', value: payload.location || 'N/D', inline: false },
      ],
      payload,
    });
  } else {
    await registerLog({
      category,
      action: payload.action || category,
      title: payload.title || `Log ${category}`,
      passport: payload.passport || null,
      actorPassport: payload.actorPassport || null,
      targetPassport: payload.targetPassport || null,
      discordId: payload.discordId || null,
      message: payload.message || `Evento ${category} recebido da base FiveM.`,
      payload,
    });
  }

  return res.json({ ok: true });
}

module.exports = {
  health,
  receiveFiveMLog,
};
