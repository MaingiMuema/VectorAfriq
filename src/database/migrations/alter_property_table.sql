-- Rename size column to floorSize
ALTER TABLE property 
CHANGE size floorSize DECIMAL(10,2);

-- Add plotSize column
ALTER TABLE property 
ADD plotSize DECIMAL(10,2) AFTER floorSize;

-- Add paymentTerms column
ALTER TABLE property 
ADD paymentTerms ENUM('Cash', 'Mortgage', 'Installments', 'Cash and Mortgage', 'Rent to Own') AFTER price;

-- Update existing rows with default values
UPDATE property 
SET plotSize = floorSize WHERE plotSize IS NULL;