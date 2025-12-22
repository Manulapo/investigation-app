<template>
  <div class="help-page">
    <div class="help-header">
      <router-link to="/" class="back-btn">←</router-link>
      <h1>Guida al Gioco</h1>
    </div>

    <div class="help-content">
      <section>
        <h2>Come Giocare</h2>
        <p>Benvenuto nel Progetto Detective! Questo è un gioco di investigazione dove devi risolvere enigmi comunicando con vari contatti.</p>
      </section>

      <section>
        <h2>Invio dei Messaggi</h2>
        <p>Per rispondere agli enigmi, usa il formato:</p>
        <code>T{N}: la tua risposta</code>
        <p>Dove {N} è il numero del turno (es: T1, T2, T3).</p>
      </section>

      <section>
        <h2>Contatti</h2>
        <ul>
          <li><strong>L'Informatore</strong>: Il tuo contatto iniziale anonimo.</li>
          <li><strong>Il Detective</strong>: Un investigatore della polizia.</li>
          <li><strong>Il Risolutore</strong>: L'agente finale che chiude il caso.</li>
        </ul>
      </section>

      <section>
        <h2>Notifiche</h2>
        <p>Riceverai notifiche quando nuovi contatti diventano disponibili o quando ci sono aggiornamenti importanti.</p>
      </section>

      <section>
        <h2>Prove e Media</h2>
        <p>Risolvendo gli enigmi, sbloccherai prove e media che puoi visualizzare nei profili dei contatti.</p>
      </section>

      <section>
        <h2>Suggerimenti</h2>
        <ul>
          <li>Presta attenzione alle parole chiave nelle risposte.</li>
          <li>Se fai troppi errori, subirai un periodo di attesa.</li>
          <li>Usa gli indizi se sei bloccato.</li>
        </ul>
      </section>

      <section>
        <h2>Debug</h2>
        <p>Per testare, le risposte corrette sono indicate tra parentesi nelle domande.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed for static help page
</script>

<style scoped lang="scss">
.help-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ece5dd;
}

.help-header {
  background: #075e54;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.back-btn {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: white;
  text-decoration: none;
}

.help-header h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.help-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.help-content section {
  background: white;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.help-content h2 {
  margin-top: 0;
  color: #075e54;
  font-size: 1.1rem;
}

.help-content p {
  margin: 0.5rem 0;
  line-height: 1.4;
}

.help-content ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.help-content li {
  margin: 0.25rem 0;
}

code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}
</style>