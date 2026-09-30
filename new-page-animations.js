(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const select = selector => gsap.utils.toArray(selector);

  media.add({
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 768px)',
    tablet: '(min-width: 576px)',
    hover: '(hover: hover) and (pointer: fine)',
  }, context => {
    if (!context.conditions.motion) return;
    const { desktop, hover } = context.conditions;
    const cleanups = [];
    const entrances = new Map();

    // Start reveals on entry, rather than hiding the entire page on load.
    function reveal(elements, trigger, options = {}) {
      const targets = typeof elements === 'string' ? select(elements) : elements;
      if (!targets.length) return;
      ScrollTrigger.create({
        trigger,
        start: 'top 92%',
        once: true,
        onEnter: () => context.add(() => {
          const visible = targets.filter(element => !element.closest('[hidden]'));
          if (!visible.length) return;
          const tween = gsap.from(visible, {
            opacity: 0, y: desktop ? 38 : 20,
            duration: .85, stagger: .09, ease: 'power3.out',
            clearProps: 'opacity,transform', ...options,
          });
          visible.forEach(element => entrances.set(element, tween));
        }),
      });
    }

    const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const heroSection = document.querySelector('.hero');
    const visual = document.querySelector('.hero-visual');
    const video = visual?.querySelector('.hero-video');
    const playButton = visual?.querySelector('.video-button');
    const titleLines = select('#hero-title > span');
    const sheen = document.createElement('span');
    sheen.className = 'hero-light-sweep';
    sheen.setAttribute('aria-hidden', 'true');
    visual?.append(sheen);
    cleanups.push(() => sheen.remove());

    // Animate the existing language-aware spans, preserving translations and semantics.
    if (window.scrollY < window.innerHeight) {
      hero.from('.site-header .brand, .header-actions > *', {
        y: -14, opacity: 0, duration: .7, stagger: .07, clearProps: 'opacity,transform',
      }, 0)
      .from('.hero .eyebrow', {
        y: 12, opacity: 0, duration: .65, clearProps: 'opacity,transform',
      }, .15)
      .fromTo(titleLines, {
        clipPath: 'inset(0% 0% 105% 0%)', y: desktop ? 32 : 16, opacity: .15,
      }, {
        clipPath: 'inset(-20% -5% -20% -5%)', y: 0, opacity: 1,
        duration: 1.15, stagger: .14, ease: 'power4.out',
        clearProps: 'clipPath,transform,opacity',
      }, .25)
      .fromTo(visual, {
        clipPath: desktop ? 'inset(10% 44% 10% 44% round 120px)' : 'inset(8% 6% 8% 6% round 28px)',
        opacity: 0,
      }, {
        clipPath: 'inset(0% 0% 0% 0% round 22px)', opacity: 1,
        duration: 1.65, ease: 'power4.inOut', clearProps: 'clipPath,opacity',
      }, .1)
      .from('.hero .intro', {
        y: 18, opacity: 0, duration: .8, clearProps: 'opacity,transform',
      }, .9)
      .from('.hero-actions > *', {
        y: 16, opacity: 0, duration: .65, stagger: .12, clearProps: 'opacity,transform',
      }, 1.05)
      .from(playButton, {
        opacity: 0, scale: .8, duration: .7, ease: 'back.out(1.4)', clearProps: 'opacity,transform',
      }, 1.35)
      .fromTo(sheen, { xPercent: -150, opacity: 0 }, {
        xPercent: 150, opacity: .65, duration: 1.5, ease: 'power2.inOut',
      }, .65)
      .to(sheen, { opacity: 0, duration: .3 }, 1.95);
    }

    if (desktop && video) {
      gsap.fromTo(video, { scale: 1.035, yPercent: -1 }, {
        scale: 1.12, yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: 1.2 },
      });
    }



    // Reversible journey choreography. Stable Bootstrap columns are the triggers;
    // only their contents move, so refreshes do not shift the scroll thresholds.
    const journeyHeading = document.querySelector('.journey-heading');
    const journeyColumns = select('.journey-grid > .col');
    const columnsPerRow = desktop ? 3 : context.conditions.tablet ? 2 : 1;
    if (journeyHeading) {
      gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          id: 'journey-heading', trigger: journeyHeading,
          start: 'top 95%', end: 'top 65%', scrub: .65, invalidateOnRefresh: true,
        },
      }).from('.journey-heading .eyebrow', { opacity: 0, y: 14, duration: .4 }, 0)
        .fromTo('#journey-title', { clipPath: 'inset(0% 0% 100% 0%)', y: 26 }, {
          clipPath: 'inset(-20% -5% -20% -5%)', y: 0, duration: 1,
        }, .1)
        .from('.journey-intro', { opacity: 0, y: 20, duration: .7 }, .35);
    }
    for (let index = 0; index < journeyColumns.length; index += columnsPerRow) {
      const row = journeyColumns.slice(index, index + columnsPerRow);
      const cards = row.map(column => column.querySelector('.journey-card'));
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          id: `journey-row-${index / columnsPerRow}`,
          trigger: row[0], start: 'top 96%', end: 'top 53%', scrub: .75, invalidateOnRefresh: true,
        },
      });
      cards.forEach((card, cardIndex) => {
        const offset = cardIndex * .14;
        timeline.fromTo(card, {
          opacity: 0, y: desktop ? 64 : 32, scale: .94,
          rotationX: desktop ? 7 : 0, transformPerspective: 1000,
          transformOrigin: '50% 100%',
        }, {
          opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1,
        }, offset)
        .from(card.querySelector('img'), { scale: .88, opacity: .3, duration: .75 }, offset + .15)
        .from(card.querySelectorAll('h3, .journey-card-main p'), {
          opacity: 0, y: 12, duration: .65, stagger: .08,
        }, offset + .23)
        .from(card.querySelectorAll('.journey-tags li'), {
          opacity: 0, y: 9, duration: .4, stagger: .055,
        }, offset + .45);
        entrances.set(card, timeline);
      });
    }
    const journeyAction = document.querySelector('.journey-action');
    if (journeyAction) {
      const actionTween = gsap.from(journeyAction, {
        opacity: 0, y: 20, ease: 'power2.out',
        scrollTrigger: { id: 'journey-action', trigger: journeyAction.parentElement,
          start: 'bottom bottom', end: 'bottom 83%', scrub: .5 },
      });
      entrances.set(journeyAction, actionTween);
    }

    // Sacred cycle: a coordinated editorial reveal, driven in both directions.
    const sacredSection = document.querySelector('.sacred-journey');
    const sacredCopy = sacredSection?.querySelector('.sacred-journey-copy');
    const sacredVisual = sacredSection?.querySelector('.sacred-journey-visual');
    if (sacredCopy && sacredVisual) {
      const image = sacredVisual.querySelector('img');
      const wash = document.createElement('span');
      wash.className = 'sacred-image-wash';
      wash.setAttribute('aria-hidden', 'true');
      sacredVisual.append(wash);
      cleanups.push(() => wash.remove());

      const textTimeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          id: 'sacred-copy', trigger: desktop ? sacredSection : sacredCopy,
          start: 'top 92%', end: desktop ? 'top 30%' : 'top 28%', scrub: .85, invalidateOnRefresh: true,
        },
      });
      textTimeline.from(sacredCopy.querySelector('.eyebrow'), {
        opacity: 0, x: -14, duration: .5,
      }, 0).fromTo(sacredCopy.querySelectorAll('h2 > span'), {
        clipPath: 'inset(0% 0% 110% 0%)', y: desktop ? 32 : 18,
        opacity: .2,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, opacity: 1,
        duration: 1, stagger: .18,
      }, .12).from(sacredCopy.querySelector('.sacred-journey-description'), {
        opacity: 0, y: 22, duration: .8,
      }, .6).from(sacredCopy.querySelector('.sacred-journey-button'), {
        opacity: 0, y: 14, scale: .96, duration: .6,
      }, 1);
      entrances.set(sacredCopy, textTimeline);

      // Separate mobile image trigger avoids completing the effect below the fold.
      const imageTimeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          id: 'sacred-image', trigger: desktop ? sacredSection : sacredVisual.parentElement,
          start: 'top 94%', end: desktop ? 'top 25%' : 'top 40%', scrub: 1, invalidateOnRefresh: true,
        },
      });
      imageTimeline.fromTo(sacredVisual, {
        clipPath: desktop ? 'inset(8% 48% 8% 8% round 80px)' : 'inset(5% 12% 5% 12% round 40px)',
        opacity: .15,
      }, {
        clipPath: 'inset(0% 0% 0% 0% round 22px)', opacity: 1, duration: 1.4,
      }, 0).fromTo(image, { scale: 1.18, xPercent: -3 }, {
        scale: 1, xPercent: 0, duration: 1.8, ease: 'power2.out',
      }, 0).fromTo(wash, { xPercent: -110, opacity: 0 }, {
        xPercent: 110, opacity: .55, duration: 1.2,
      }, .2).to(wash, { opacity: 0, duration: .4 }, 1.25);
    }

    // Sacred days: reveal the editorial header, then unfold each event independently.
    const ceremoniesSection = document.querySelector('.ceremonies');
    if (ceremoniesSection) {
      const headerTimeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          id: 'ceremonies-heading', trigger: ceremoniesSection,
          start: 'top 94%', end: 'top 55%', scrub: .7, invalidateOnRefresh: true,
        },
      });
      headerTimeline.from(ceremoniesSection.querySelector('.eyebrow'), {
        opacity: 0, x: -12, duration: .45,
      }, 0).fromTo('#ceremonies-title', {
        clipPath: 'inset(0% 0% 110% 0%)', y: 28,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: 1,
      }, .1).from('.ceremonies-intro', {
        opacity: 0, y: 16, duration: .65,
      }, .3).from('.ceremony-filters > button', {
        opacity: 0, y: 12, duration: .5, stagger: .07,
      }, .45);
      const filters = ceremoniesSection.querySelector('.ceremony-filters');
      entrances.set(filters, headerTimeline);

      let rowsContext;
      const rebuildCeremonyRows = () => {
        rowsContext?.revert();
        rowsContext = gsap.context(() => {
          select('.ceremony-row').filter(row => !row.hidden).forEach((row, index) => {
            const timeline = gsap.timeline({
              defaults: { ease: 'power2.out' },
              scrollTrigger: {
                id: `ceremony-event-${index}`, trigger: row,
                start: 'top 96%', end: 'top 67%', scrub: .65, invalidateOnRefresh: true,
              },
            });
            timeline.fromTo(row, {
              clipPath: desktop ? 'inset(0% 16% 0% 0% round 17px)' : 'inset(0% 5% 0% 0% round 17px)',
              opacity: .15,
            }, {
              clipPath: 'inset(0% 0% 0% 0% round 17px)', opacity: 1, duration: 1.1,
            }, 0).from(row.querySelector('.ceremony-date'), {
              opacity: 0, x: -14, duration: .6,
            }, .05).from(row.querySelector('h3'), {
              opacity: 0, x: desktop ? 24 : 0, y: desktop ? 0 : 12, duration: .7,
            }, .22).from(row.querySelector('.ceremony-description'), {
              opacity: 0, y: 12, duration: .7,
            }, .38);
          });
        }, ceremoniesSection);
      };
      rebuildCeremonyRows();
      const onCeremonyFilter = () => {
        rebuildCeremonyRows();
        ScrollTrigger.refresh();
      };
      document.addEventListener('ceremonies:filtered', onCeremonyFilter);
      cleanups.push(() => {
        document.removeEventListener('ceremonies:filtered', onCeremonyFilter);
        rowsContext?.revert();
      });
    }

    // Pilgrimage highlights: image shutters open into layered editorial captions.
    const highlightsHeading = document.querySelector('.highlights-heading');
    if (highlightsHeading) {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { id: 'highlights-heading', trigger: highlightsHeading,
          start: 'top 94%', end: 'top 58%', scrub: .7, invalidateOnRefresh: true },
      }).from(highlightsHeading.querySelector('.eyebrow'), {
        opacity: 0, y: 12, duration: .45,
      }, 0).fromTo('#highlights-title', {
        clipPath: 'inset(0% 0% 110% 0%)', y: 24,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: 1,
      }, .12).from(highlightsHeading.querySelector('p:last-child'), {
        opacity: 0, y: 16, duration: .75,
      }, .4);
    }
    const highlightColumns = select('.highlights-grid > .col');
    for (let index = 0; index < highlightColumns.length; index += columnsPerRow) {
      const row = highlightColumns.slice(index, index + columnsPerRow);
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          id: `highlights-row-${index / columnsPerRow}`, trigger: row[0],
          start: 'top 96%', end: desktop ? 'top 38%' : 'top 48%', scrub: .9, invalidateOnRefresh: true,
        },
      });
      row.forEach((column, cardIndex) => {
        const card = column.querySelector('.highlight-card');
        const offset = cardIndex * .13;
        timeline.fromTo(card, {
          clipPath: 'inset(14% 5% 10% 5% round 60px)', opacity: .1,
          y: desktop ? 52 : 24, rotation: desktop ? (cardIndex - 1) * 1.2 : 0,
        }, {
          clipPath: 'inset(0% 0% 0% 0% round 18px)', opacity: 1,
          y: 0, rotation: 0, duration: 1.2,
        }, offset).fromTo(card.querySelector('img'), {
          scale: 1.22, yPercent: -3,
        }, {
          scale: 1, yPercent: 0, duration: 1.65,
        }, offset).from(card.querySelector('.highlight-label'), {
          opacity: 0, x: -12, duration: .5,
        }, offset + .25).fromTo(card.querySelector('.highlight-copy h3'), {
          clipPath: 'inset(0% 0% 110% 0%)', y: 16,
        }, {
          clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: .65,
        }, offset + .45).from(card.querySelector('.highlight-copy p'), {
          opacity: 0, y: 12, duration: .65,
        }, offset + .65);
        entrances.set(card, timeline);
      });
    }
    const highlightsAction = document.querySelector('.highlights-action');
    if (highlightsAction) {
      // Animate the outer wrapper so the button retains its independent hover effect.
      const actionTimeline = gsap.from(highlightsAction, {
        opacity: 0, y: 22, ease: 'power2.out',
        scrollTrigger: { id: 'highlights-action', trigger: highlightsAction.parentElement,
          start: 'bottom 98%', end: 'bottom 80%', scrub: .6, invalidateOnRefresh: true },
      });
      entrances.set(highlightsAction, actionTimeline);
    }

    // Holy cities: paired curtains opening toward each other, with layered captions.
    const citiesHeading = document.querySelector('.cities-heading');
    if (citiesHeading) {
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { id: 'cities-heading', trigger: citiesHeading,
          start: 'top 94%', end: 'top 57%', scrub: .75, invalidateOnRefresh: true },
      }).from(citiesHeading.querySelector('.eyebrow'), {
        opacity: 0, y: 12, duration: .45,
      }, 0).fromTo(citiesHeading.querySelectorAll('h2 > span'), {
        clipPath: 'inset(0% 0% 110% 0%)', y: 26,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0,
        duration: 1, stagger: .2,
      }, .15);
    }
    const cityColumns = select('.cities-grid > .col');
    cityColumns.forEach((column, index) => {
      const card = column.querySelector('.city-card');
      const direction = index % 2 === 0 ? -1 : 1;
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          id: `holy-city-${index}`, trigger: column,
          start: 'top 95%', end: desktop ? 'top 38%' : 'top 48%', scrub: .9, invalidateOnRefresh: true,
        },
      });
      timeline.fromTo(card, {
        clipPath: desktop
          ? (direction < 0 ? 'inset(5% 35% 5% 0% round 40px)' : 'inset(5% 0% 5% 35% round 40px)')
          : 'inset(8% 5% 8% 5% round 32px)',
        opacity: .15, y: desktop ? 34 : 22,
      }, {
        clipPath: 'inset(0% 0% 0% 0% round 18px)',
        opacity: 1, y: 0, duration: 1.25,
      }, 0).fromTo(card.querySelector('img'), {
        scale: 1.18, xPercent: direction * 3,
      }, {
        scale: 1, xPercent: 0, duration: 1.7,
      }, 0).from(card.querySelector('.city-name'), {
        opacity: 0, x: direction * 14, duration: .55,
      }, .25).fromTo(card.querySelector('.city-copy h3'), {
        clipPath: 'inset(0% 0% 110% 0%)', y: 18,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: .75,
      }, .45).from(card.querySelectorAll('.city-tags li'), {
        opacity: 0, y: 10, duration: .45, stagger: .065,
      }, .7);
      entrances.set(card, timeline);
    });

    // Final chapters use scrubbed timelines, so every reveal follows scroll direction.
    function chapterTimeline(trigger, id, end = 'top 55%') {
      return gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { id, trigger, start: 'top 96%', end, scrub: .75, invalidateOnRefresh: true },
      });
    }
    const storiesHeading = document.querySelector('.stories-heading');
    if (storiesHeading) {
      chapterTimeline(storiesHeading, 'stories-heading')
        .from(storiesHeading.querySelector('.eyebrow'), { opacity: 0, y: 12, duration: .4 }, 0)
        .fromTo('#stories-title', { clipPath: 'inset(0% 0% 110% 0%)', y: 24 }, {
          clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: 1,
        }, .1)
        .from('.stories-intro', { opacity: 0, y: 16, duration: .7 }, .35);
    }
    select('.stories-grid > .col').forEach((column, index) => {
      const card = column.querySelector('.story-card');
      const timeline = chapterTimeline(column, `story-${index}`, 'top 43%');
      timeline.fromTo(card.querySelector('img'), {
        clipPath: 'inset(10% 6% 10% 6% round 40px)', opacity: .1,
      }, {
        clipPath: 'inset(0% 0% 0% 0% round 18px)', opacity: 1, duration: 1.1,
      }, 0).from(card.querySelectorAll('.story-category, h3, .story-excerpt, .story-details'), {
        opacity: 0, y: 18, duration: .7, stagger: .12,
      }, .25);
      entrances.set(card, timeline);
    });

    const newsHeading = document.querySelector('.news-heading');
    if (newsHeading) {
      const timeline = chapterTimeline(newsHeading, 'news-heading');
      timeline.fromTo('#news-title', { clipPath: 'inset(0% 0% 110% 0%)', y: 22 }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: 1,
      }, 0).from('.news-filters > button', { opacity: 0, y: 12, duration: .5, stagger: .08 }, .2);
      entrances.set(newsHeading, timeline);
    }
    let newsContext;
    const rebuildNewsRows = () => {
      // Drop references to reverted timelines when a filter changes the list.
      select('.news-item').forEach(item => entrances.delete(item));
      newsContext?.revert();
      newsContext = gsap.context(() => {
        select('.news-item').filter(item => !item.hidden).forEach((item, index) => {
          const timeline = chapterTimeline(item, `news-row-${index}`, 'top 70%');
          timeline.from(item.querySelector('.news-meta'), { opacity: 0, x: -12, duration: .6 }, 0)
            .from(item.querySelectorAll('.news-copy h3, .news-copy p'), {
              opacity: 0, y: 14, duration: .7, stagger: .12,
            }, .12).from(item.querySelector('.news-arrow'), { opacity: 0, x: -14, duration: .5 }, .4);
          entrances.set(item, timeline);
        });
      });
    };
    rebuildNewsRows();
    const onNewsFilter = () => { rebuildNewsRows(); ScrollTrigger.refresh(); };
    document.addEventListener('news:filtered', onNewsFilter);
    cleanups.push(() => { document.removeEventListener('news:filtered', onNewsFilter); newsContext?.revert(); });

    const helpBar = document.querySelector('.help-bar');
    if (helpBar) {
      const timeline = chapterTimeline(helpBar, 'help-bar', 'top 78%');
      timeline.from('#help-title', { opacity: 0, x: -20, duration: .7 }, 0)
        .from('.help-links > *', { opacity: 0, y: 12, duration: .5, stagger: .07 }, .15);
      entrances.set(helpBar, timeline);
    }
    const closingBanner = document.querySelector('.pilgrimage-banner');
    if (closingBanner) {
      const timeline = chapterTimeline(closingBanner.parentElement, 'closing-banner', 'top 38%');
      timeline.fromTo(closingBanner, {
        clipPath: 'inset(6% 8% 6% 8% round 60px)', opacity: .2,
      }, {
        clipPath: 'inset(0% 0% 0% 0% round 26px)', opacity: 1, duration: 1.3,
      }, 0).fromTo('.pilgrimage-banner-image', { scale: 1.15 }, { scale: 1, duration: 1.8 }, 0)
        .from('.pilgrimage-banner-eyebrow', { opacity: 0, y: 12, duration: .6 }, .15)
        .fromTo('#pilgrimage-banner-title > span', {
          clipPath: 'inset(0% 0% 110% 0%)', y: 26,
        }, {
          clipPath: 'inset(-25% -5% -25% -5%)', y: 0, duration: .85, stagger: .16,
        }, .35)
        .from('.pilgrimage-banner-description, .pilgrimage-banner-button', {
          opacity: 0, y: 16, duration: .7, stagger: .15,
        }, .85);
      entrances.set(closingBanner, timeline);
    }

    const numbersHeading = document.querySelector('#numbers-title');
    if (numbersHeading) {
      gsap.fromTo(numbersHeading, {
        clipPath: 'inset(0% 0% 110% 0%)', y: 22,
      }, {
        clipPath: 'inset(-25% -5% -25% -5%)', y: 0, ease: 'power2.out',
        scrollTrigger: { id: 'numbers-heading', trigger: numbersHeading,
          start: 'top 94%', end: 'top 60%', scrub: .65 },
      });
    }
    select('.numbers-grid > .col').forEach((column, index) => {
      const card = column.querySelector('.number-card');
      const element = card.querySelector('.number-value');
      const original = element.textContent.trim();
      const target = Number(original);
      if (!Number.isFinite(target)) return;
      const counter = { value: 0 };
      const renderNumber = () => {
        const value = String(Math.round(counter.value));
        element.textContent = original.startsWith('0') ? value.padStart(original.length, '0') : value;
      };
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { id: `number-card-${index}`, trigger: column,
          start: 'top 96%', end: 'top 55%', scrub: .75 },
      });
      timeline.fromTo(card, { opacity: 0, y: desktop ? 38 : 24, scale: .95 }, {
        opacity: 1, y: 0, scale: 1, duration: 1,
      }, 0).from(card.querySelector('.number-label'), {
        opacity: 0, y: 10, duration: .65,
      }, .2).fromTo(counter, { value: 0 }, {
        value: target, duration: 1.25, ease: 'none', onUpdate: renderNumber,
      }, .15);
      const icon = card.querySelector('.number-icon');
      if (icon) timeline.from(icon, { opacity: 0, scale: .8, duration: .8 }, .15);
      entrances.set(card, timeline);
      cleanups.push(() => { element.textContent = original; });
    });

    reveal(select('.footer-brand, .footer-column'), '.footer-main', { y: 22 });

    if (hover) {
      select('.button:not(.sacred-journey-button):not(.pilgrimage-banner-button)').forEach(element => {
        const enter = () => context.add(() => gsap.to(element, { y: -4, duration: .25, ease: 'power2.out', overwrite: 'auto' }));
        const leave = () => context.add(() => gsap.to(element, { y: 0, duration: .35, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform' }));
        element.addEventListener('pointerenter', enter);
        element.addEventListener('pointerleave', leave);
        cleanups.push(() => { element.removeEventListener('pointerenter', enter); element.removeEventListener('pointerleave', leave); });
      });
    }
    const onFocus = event => {
      hero.progress(1);
      entrances.forEach((tween, element) => { if (element.contains(event.target)) tween.progress(1); });
    };
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('focusin', onFocus);
      cleanups.forEach(cleanup => cleanup());
    };
  });

  // Filters, translated text, lazy images and expanded stories change section positions.
  let refreshTimer;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
  }
  new ResizeObserver(refresh).observe(document.body);
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
})();
