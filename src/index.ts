import sqlite3 from 'sqlite3'
import jsYaml from 'js-yaml'
import fs from 'fs/promises'


const main = async () => {

  const indices_paths = (await fs.readdir('./assets/'))
    .filter(filename => filename.toLowerCase().endsWith('.yaml') || filename.toLowerCase().endsWith('.yml'))
    .map(filename => `./assets/${filename}`)

  const archives = (await Promise.all(indices_paths.map(path => fs.readFile(path)))).flatMap(buffer => jsYaml.load(buffer.toString())) as any[]
  // console.log([...new Set(archives.flatMap((archive: any) => Object.keys(archive)))])

  await fs.rm('./papyrus.sqlite')
  const db = new sqlite3.Database('./papyrus.sqlite')

  db.serialize(() => {
    db.run(`
    CREATE TABLE papyrus(
      title string,
      authors string,
      publisher string,
      date_of_publish string,
      isbn string,
      archive,
      tags,
      status,
      printing,
      journal,
      volume
    )`)

    for (const archive of archives) {
      const authors = [archive.authors].flatMap(authors => authors).join(',')

      db.run(`
        INSERT INTO papyrus
          (title, authors)
        VALUES
          (?, ?);
      `, [
        archive.title,
        authors
      ])
    }
  })

  // test
  db.all(`SELECt * from papyrus;`, (_err, rows) => console.log(rows))

  db.close()

}

main()
