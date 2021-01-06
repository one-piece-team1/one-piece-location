import { join } from 'path';
import { DBFFile } from 'dbffile';
import * as fs from 'fs';

class dbfHandler {
  private readonly port_file_path: string = join(
    process.cwd(),
    'datasets/ports/WPI.dbf',
  );

  public async readPort() {
    const dbf = await DBFFile.open(this.port_file_path);
    console.log(`DBF file contains ${dbf.recordCount} records.`);
    console.log(`Field names: ${dbf.fields.map(f => f.name).join(', ')}`);
    const records = await dbf.readRecords(1);
    for (const record of records) {
      console.log(records);
    }
  }
}

new dbfHandler().readPort();
