import test from 'node:test';
import assert from 'node:assert/strict';
import { generationSchema } from '../src/lib/generation';
test('generation accepts a model, prompt and owned-asset identifiers', () => {
  const value = generationSchema.parse({
    prompt: '  A blue lake  ',
    model: 'provider/model',
    kind: 'image',
    aspectRatio: '16:9',
    references: ['110e8400-e29b-41d4-a716-446655440000'],
  });
  assert.equal(value.prompt, 'A blue lake');
  assert.equal(value.references.length, 1);
});
test('arbitrary URLs cannot be passed as media references', () => {
  assert.equal(
    generationSchema.safeParse({
      prompt: 'Lake',
      model: 'provider/model',
      kind: 'image',
      aspectRatio: '1:1',
      references: ['http://169.254.169.254/latest/meta-data'],
    }).success,
    false,
  );
});
test('empty prompts, excessive references and unknown modes are rejected', () => {
  const base = {
    prompt: 'A lake',
    model: 'provider/model',
    kind: 'image',
    aspectRatio: '1:1',
  };
  for (const patch of [
    { prompt: '  ' },
    { kind: 'audio' },
    { references: Array(5).fill('110e8400-e29b-41d4-a716-446655440000') },
    { prompt: 'x'.repeat(12001) },
  ])
    assert.equal(
      generationSchema.safeParse({ ...base, ...patch }).success,
      false,
    );
});
