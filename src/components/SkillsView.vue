<template>
  <section class="skills-view">
    <header class="skills-hero">
      <div>
        <p class="skills-kicker">BUILT-IN VISUAL RECIPES</p>
        <h1>选择画风，再描述你的画面</h1>
        <p class="skills-intro">每个 Skill 都是一套经过整理的视觉语言。它不会替你决定内容，只负责把构图、材质、光线和笔触说得更准确。</p>
      </div>
      <div class="recipe-mark" aria-hidden="true"><span>主题</span><i /><span>风格</span><i /><span>成图</span></div>
    </header>

    <div class="skills-toolbar">
      <div class="category-tabs" role="tablist" aria-label="Skill 分类">
        <button v-for="category in categories" :key="category" class="category-tab" :class="{ active: activeCategory === category }" @click="activeCategory = category">
          {{ category }}
        </button>
      </div>
      <span class="skills-count">{{ filteredSkills.length }} 个内置 Skills</span>
    </div>

    <div class="skills-grid">
      <article v-for="(skill, index) in filteredSkills" :key="skill.id" class="skill-card" :class="{ selected: skill.id === activeSkillId }" :style="{ '--skill-accent': skill.accent, '--skill-tone': skill.tone }">
        <div class="skill-preview">
          <span class="skill-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <img :src="skill.cover" :alt="`${skill.name}风格示例插画`" />
          <span class="preview-copy">{{ skill.preview }}</span>
        </div>

        <div class="skill-content">
          <div class="skill-title-row">
            <div><span class="skill-category">{{ skill.category }}</span><h2>{{ skill.name }}</h2></div>
            <span v-if="skill.id === activeSkillId" class="selected-badge">使用中</span>
          </div>
          <p>{{ skill.description }}</p>
          <p class="skill-best"><b>适合：</b>{{ skill.bestFor }}</p>
          <div class="skill-tags"><span v-for="tag in skill.tags" :key="tag">{{ tag }}</span></div>
          <button class="use-skill" @click="$emit('select', skill)">
            {{ skill.id === activeSkillId ? '继续使用' : '使用这个 Skill' }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BUILTIN_SKILLS } from '../lib/skills'

defineProps({ activeSkillId: { type: String, default: '' } })
defineEmits(['select'])

const activeCategory = ref('全部')
const categories = ['全部', ...new Set(BUILTIN_SKILLS.map((skill) => skill.category))]
const filteredSkills = computed(() => activeCategory.value === '全部' ? BUILTIN_SKILLS : BUILTIN_SKILLS.filter((skill) => skill.category === activeCategory.value))
</script>

<style scoped>
.skills-view {
  flex: 1; overflow-y: auto; padding: 56px clamp(22px, 5vw, 72px) 72px;
  background: linear-gradient(rgba(19, 27, 25, .035) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 27, 25, .035) 1px, transparent 1px), #f5f7f3;
  background-size: 28px 28px;
}
.skills-hero { max-width: 1180px; margin: 0 auto 44px; display: flex; align-items: flex-end; justify-content: space-between; gap: 36px; }
.skills-kicker { margin: 0 0 12px; color: #0c755f; font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; }
.skills-hero h1 { margin: 0; max-width: 760px; font-size: clamp(34px, 5vw, 62px); line-height: 1.05; letter-spacing: -.055em; color: #17211e; }
.skills-intro { max-width: 720px; margin: 18px 0 0; font-size: 15px; line-height: 1.8; color: #5b6662; }
.recipe-mark { flex: 0 0 auto; display: flex; align-items: center; padding: 13px 16px; border: 1px solid #cfd6cf; background: rgba(255, 255, 255, .72); box-shadow: 8px 8px 0 #dfe7df; color: #40504a; font-size: 12px; font-weight: 650; }
.recipe-mark i { width: 28px; height: 1px; margin: 0 9px; background: #8c9993; position: relative; }
.recipe-mark i::after { content: ''; position: absolute; right: -1px; top: -3px; border-left: 5px solid #8c9993; border-top: 3px solid transparent; border-bottom: 3px solid transparent; }
.skills-toolbar { max-width: 1180px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.category-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.category-tab { padding: 7px 13px; border: 1px solid #d4dcd5; border-radius: 7px; background: rgba(255, 255, 255, .75); color: #56635e; font-size: 12px; }
.category-tab:hover, .category-tab.active { border-color: #17211e; background: #17211e; color: #fff; }
.skills-count { color: #7a8580; font-size: 12px; white-space: nowrap; }
.skills-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.skill-card { min-width: 0; display: grid; grid-template-columns: minmax(150px, .78fr) minmax(230px, 1.22fr); border: 1px solid #d9ded9; background: rgba(255, 255, 255, .92); box-shadow: 0 8px 30px rgba(37, 52, 46, .055); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.skill-card:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--skill-accent) 52%, #d9ded9); box-shadow: 0 16px 36px rgba(37, 52, 46, .1); }
.skill-card.selected { outline: 2px solid var(--skill-accent); outline-offset: -2px; }
.skill-preview { min-height: 250px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; background: linear-gradient(145deg, var(--skill-tone), #fff 76%); position: relative; }
.skill-index { position: relative; z-index: 2; color: color-mix(in srgb, var(--skill-accent) 82%, #111); font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
.skill-preview img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
.skill-card:hover .skill-preview img { transform: scale(1.035); }
.skill-preview::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,.08), transparent 48%, rgba(15,24,21,.46)); }
.preview-copy { position: relative; z-index: 2; max-width: 150px; color: #24312c; font-size: 12px; line-height: 1.55; }
.skill-preview .preview-copy { color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,.45); }
.skill-content { padding: 24px; display: flex; flex-direction: column; }
.skill-title-row { display: flex; justify-content: space-between; gap: 12px; }
.skill-category { color: var(--skill-accent); font-size: 11px; font-weight: 700; }
.skill-content h2 { margin: 5px 0 0; color: #17211e; font-size: 23px; letter-spacing: -.025em; }
.selected-badge { align-self: flex-start; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, var(--skill-accent) 13%, white); color: var(--skill-accent); font-size: 11px; font-weight: 700; }
.skill-content > p { margin: 14px 0 16px; color: #64706b; font-size: 13px; line-height: 1.65; }
.skill-content > .skill-best { margin: -7px 0 15px; font-size: 11px; color: #78837e; }
.skill-best b { color: #4e5b56; }
.skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
.skill-tags span { padding: 4px 7px; border: 1px solid #e1e5e1; background: #f8f9f7; color: #6b7571; font-size: 10px; }
.use-skill { margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 9px; padding: 9px 13px; border: 0; border-bottom: 2px solid var(--skill-accent); background: transparent; color: #27332f; font-size: 13px; font-weight: 650; }
.use-skill:hover { background: color-mix(in srgb, var(--skill-accent) 8%, white); }
@media (max-width: 1000px) { .skills-grid { grid-template-columns: 1fr; } }
@media (max-width: 680px) {
  .skills-view { padding: 34px 16px 52px; }
  .skills-hero { align-items: flex-start; flex-direction: column; margin-bottom: 30px; }
  .recipe-mark { display: none; }
  .skills-toolbar { align-items: flex-start; flex-direction: column; }
  .skill-card { grid-template-columns: 118px minmax(0, 1fr); }
  .skill-preview { min-height: 270px; padding: 12px; }
  .skill-content { padding: 18px; }
  .skill-content h2 { font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) { .skill-card { transition: none; } }
</style>
