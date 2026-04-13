/*
  # Fix pedidos table for new status values and add orcamento_numero column

  ## Changes:
  1. Remove old CHECK constraint on `pedidos.status` that only allowed 'Aguardando', 'Produção', 'Acabamento', 'Entrega', 'Concluído'
  2. Add new CHECK constraint supporting all 8 statuses: Aguardando, Em Andamento, Em Produção, Em Acabamento, Pronto, Entregue, Atrasado, Cancelado
  3. Add `orcamento_numero` column to store the linked budget number as text for display

  ## Notes:
  - Existing rows with old status values are migrated to nearest equivalent
  - No data loss occurs
*/

-- Migrate existing status values to new equivalents
UPDATE pedidos SET status = 'Em Produção' WHERE status = 'Produção';
UPDATE pedidos SET status = 'Em Acabamento' WHERE status = 'Acabamento';
UPDATE pedidos SET status = 'Entregue' WHERE status = 'Entrega';
UPDATE pedidos SET status = 'Pronto' WHERE status = 'Concluído';

-- Drop old check constraint
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

-- Add new check constraint with all statuses
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN ('Aguardando', 'Em Andamento', 'Em Produção', 'Em Acabamento', 'Pronto', 'Entregue', 'Atrasado', 'Cancelado'));

-- Add orcamento_numero column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'orcamento_numero'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN orcamento_numero text NOT NULL DEFAULT '';
  END IF;
END $$;
