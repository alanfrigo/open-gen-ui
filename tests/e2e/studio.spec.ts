import { test, expect } from '@playwright/test';
test('creative workflow: prompt, model, references, project and assistant', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Da sua imaginação. Para o mundo.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /O extraordinário no cotidiano/ })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Descreva sua criação' }),
  ).toHaveValue(/Fotografia editorial/);
  await page.getByRole('button', { name: /Gemini Flash Image/ }).click();
  await page.getByRole('button', { name: /GPT Image/ }).click();
  await page.getByRole('button', { name: 'Gerar mídia', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Entre no seu espaço.' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Criar projeto', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Nome do projeto' })
    .fill('Campanha verão');
  await page
    .getByRole('button', { name: 'Criar projeto', exact: true })
    .last()
    .click();
  await page.getByRole('button', { name: 'Assistentes', exact: true }).click();
  await page
    .getByRole('button', { name: 'Criar assistente', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Nome', exact: true })
    .fill('Fotógrafo');
  await page
    .getByRole('textbox', { name: 'Instruções' })
    .fill('Use luz natural e composição editorial.');
  await page.getByRole('button', { name: 'Salvar assistente' }).click();
  await expect(page.getByRole('heading', { name: 'Fotógrafo' })).toBeVisible();
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole('button', { name: 'Assistentes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fotógrafo' })).toBeVisible();
});
test('mobile has no horizontal overflow and navigation works', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Skills', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Novas possibilidades.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/mobile.png', fullPage: true });
});
test('unauthenticated API cannot create or read assets', async ({
  request,
}) => {
  for (const path of [
    '/api/workspace',
    '/api/media/110e8400-e29b-41d4-a716-446655440000',
    '/api/jobs/110e8400-e29b-41d4-a716-446655440000',
  ]) {
    const response = await request.get(path);
    expect([401, 503]).toContain(response.status());
  }
  const response = await request.post('/api/generate', {
    data: { prompt: 'test' },
  });
  expect([401, 503]).toContain(response.status());
});
