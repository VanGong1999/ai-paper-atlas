async (page) => {
  const assert=(v,message)=>{if(!v)throw new Error(message)}
  const root='http://127.0.0.1:5184/papers/deepseek-v2'
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const ids=['overview','math','transformer','attention','kv-cache','comparison','mla','rope','absorption','moe','deepseekmoe','routing','communication','pretraining','alignment','inference','experiments','formulas','graph']
  let checked=0
  async function noOverflow(label){
    const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,bottom:document.querySelector('.v2-reader').getBoundingClientRect().bottom}))
    assert(await page.locator('.v2-center').evaluate(el=>el.clientWidth)>result.width*.4,`${label}: visible center pane`)
    assert(result.scroll<=result.width,`${label}: document width ${JSON.stringify(result)}`)
    assert(result.bottom<=result.height+1,`${label}: document height ${JSON.stringify(result)}`)
    assert(await page.locator('.katex-error').count()===0,`${label}: KaTeX error`)
  }
  async function theme(value){if(await page.locator('html').getAttribute('data-theme')!==value)await page.locator('.theme-toggle').click()}
  await page.setViewportSize({width:1440,height:900})
  await page.goto(root)
  await page.evaluate(()=>localStorage.setItem('orbit-v2-read','[]'))
  await page.reload(); await page.locator('.v2-reader').waitFor()
  for(const color of ['light','dark']){
    await theme(color)
    for(const id of ids){
      await page.goto(`${root}?chapter=${id}&step=0`)
      await page.locator('.v2-stage').waitFor()
      for(let step=0;step<4;step++){
        await page.locator('.v2-step-timeline button').nth(step).click()
        assert(new URL(page.url()).searchParams.get('step')===String(step),id+' step link')
        await noOverflow(`${id}:${step}:${color}`)
        checked++
      }
    }
  }
  await page.goto(`${root}?chapter=mla&step=1`)
  const before=await page.locator('.v2-numeric-strip').innerText()
  await page.getByRole('slider',{name:'Latent rank · 教学',exact:true}).focus()
  await page.keyboard.press('ArrowRight')
  assert(before!==await page.locator('.v2-numeric-strip').innerText(),'Latent rank must recompute numbers')
  await page.locator('.v2-svg-node').filter({hasText:'KV latent'}).click()
  assert((await page.locator('.v2-detail-scroll h2').innerText()).includes('KV 潜在向量'),'Concept selected')
  assert((await page.locator('.v2-detail-head').innerText()).includes('已固定概念'),'Concept pins')
  await page.getByRole('button',{name:'关闭概念详解',exact:true}).click()
  await page.getByRole('button',{name:'标记本步骤已掌握',exact:true}).click()
  await page.reload(); await page.locator('.v2-reader').waitFor()
  assert(await page.getByRole('button',{name:'已掌握本步骤',exact:true}).count()===1,'Progress survives reload')
  const sep=page.getByRole('separator',{name:'调整目录宽度',exact:true})
  await sep.focus();const link=page.url();await page.keyboard.press('ArrowRight');assert(page.url()===link,'Resize arrow must not navigate')
  const oldWidth=await page.locator('.v2-center').evaluate(el=>el.clientWidth)
  await page.getByRole('button',{name:'折叠目录',exact:true}).click()
  assert(await page.locator('.v2-center').evaluate(el=>el.clientWidth)>oldWidth,'Collapsing sidebar releases width')
  await page.getByRole('button',{name:'展开目录',exact:true}).click()
  await page.goto(`${root}?chapter=kv-cache`)
  const cacheBefore=await page.locator('.v2-cache-bar.featured strong').innerText()
  await page.getByRole('slider',{name:'Batch size',exact:true}).focus();await page.keyboard.press('ArrowRight')
  assert(cacheBefore!==await page.locator('.v2-cache-bar.featured strong').innerText(),'Batch size must change memory')
  await page.getByRole('slider',{name:'Attention heads',exact:true}).focus();await page.keyboard.press('Home')
  const kvOptions=await page.getByLabel('KV heads (GQA)',{exact:true}).locator('option').allTextContents()
  assert(kvOptions.every(x=>[1,2,4,8].includes(Number(x.split(' ')[0]))),'GQA only valid divisors')
  await page.goto(`${root}?chapter=routing`)
  const routingBefore=await page.locator('.v2-routing-losses').innerText()
  await page.getByRole('slider',{name:'Top-K · 专家数 160',exact:true}).focus();await page.keyboard.press('ArrowRight')
  assert(routingBefore!==await page.locator('.v2-routing-losses').innerText(),'Top-K changes routing counts')
  await page.goto(`${root}?chapter=attention`)
  const outputBefore=await page.locator('.v2-output-matrix code').innerText()
  await page.getByRole('textbox',{name:'自定义 Attention 输入',exact:true}).fill('1, 0; 0, 1; 1, 1')
  assert(outputBefore!==await page.locator('.v2-output-matrix code').innerText(),'Custom attention input updates output')
  await page.getByLabel('Attention head count',{exact:true}).selectOption('2')
  assert(await page.getByRole('button',{name:'Head 2',exact:true}).count()===1,'Multi-head selector appears')
  await page.getByRole('button',{name:'Head 2',exact:true}).click()
  await page.locator('.v2-custom-weights summary').click()
  const projected=await page.locator('.v2-output-matrix code').innerText()
  await page.getByLabel('自定义 WV 投影',{exact:true}).fill('0, 0, 0, 0; 0, 0, 0, 0')
  assert(projected!==await page.locator('.v2-output-matrix code').innerText(),'Custom Value matrix recomputes active head')
  await page.getByRole('textbox',{name:'自定义 Attention 输入',exact:true}).fill('invalid')
  assert(await page.locator('.v2-error').count()===1,'Invalid attention input explains fallback')
  await page.goto(`${root}?chapter=rope`)
  const ropeBefore=await page.locator('.v2-numeric-strip').innerText()
  await page.getByRole('slider',{name:'Query position',exact:true}).focus();await page.keyboard.press('ArrowRight')
  assert(ropeBefore!==await page.locator('.v2-numeric-strip').innerText(),'RoPE recalculates')
  await page.getByRole('button',{name:'公式索引',exact:true}).click()
  assert(await page.locator('.v2-original-equations section').count()===47,'All 47 numbered formulas')
  assert(await page.locator('.katex-error').count()===0,'All indexed formulas render')
  await page.getByRole('button',{name:'实验数据',exact:true}).click()
  for(let n=1;n<=37;n++){
    await page.getByLabel('选择论文原始表格',{exact:true}).selectOption(String(n))
    assert(await page.locator('.v2-source-table-scroll tr').count()>0,`Original table ${n} renders`)
  }
  await page.getByLabel('选择论文原始表格',{exact:true}).selectOption('3')
  await page.getByRole('button',{name:'▥ 数值绘图',exact:true}).click()
  assert(await page.locator('.v2-raw-chart>div').count()>3,'Original data can be plotted')
  await page.getByRole('button',{name:'源码对照',exact:true}).click()
  await page.locator('.v2-code-lines>button').nth(7).click()
  assert((await page.locator('.v2-detail-scroll h2').innerText()).includes('位置'),'Code selects concept')
  await page.goto(`${root}?chapter=mla&step=1`)
  const snapshots=[]
  for(const width of [1440,1920,2560,1100,390]){
    const height=width===390?844:width===1920?1080:width===2560?1440:900
    await page.setViewportSize({width,height})
    for(const color of ['light','dark']){
      await theme(color);await noOverflow(`${width}:${color}`)
      if(width===390){
        await page.getByRole('button',{name:'打开章节目录',exact:true}).click()
        assert(await page.locator('.v2-sidebar').isVisible(),'Mobile navigation opens')
        await page.locator('.v2-chapter.active').click()
        await page.locator('.v2-detail-toggle').click()
        assert(await page.locator('.v2-detail').isVisible(),'Mobile explanation opens')
        await page.getByRole('button',{name:'收起讲解面板',exact:true}).click()
      }
      const file=`output/deepseek-v2-${width}-${color}.png`
      await page.screenshot({path:file,animations:'disabled'})
      snapshots.push(file)
    }
  }
  await page.setViewportSize({width:1440,height:900})
  await page.goto(`${root}?chapter=bogus&step=NaN`)
  assert((await page.locator('.v2-chapter.active').innerText()).includes('论文总览'),'Invalid URL falls back')
  await page.evaluate(()=>localStorage.setItem('orbit-v2-read','{"bad":true}'))
  await page.reload(); await page.locator('.v2-reader').waitFor()
  assert(await page.locator('.v2-reader').count()===1,'Malformed storage falls back')
  const pdf=await page.request.get('http://127.0.0.1:5184/article/deepseek/2405.04434.pdf')
  assert(pdf.ok()&&pdf.headers()['content-type'].includes('application/pdf'),'Original PDF available')
  assert(errors.length===0,'Browser errors: '+errors.join('; '))
  await page.goto(`${root}?chapter=mla&step=1`)
  await theme('light')
  return {chapterStepsChecked:checked,responsiveThemeCases:snapshots.length,originalTables:37,originalFormulas:47,errors,snapshots}
}
