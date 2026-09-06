# Learn Java

A hands-on path through Java fundamentals. Each folder is a topic with runnable
example files. Read the comments, then run each file and try tweaking it.

## How to run

Every example is a single `.java` file with a `public class` matching the
filename. From inside a topic folder:

```bash
javac HelloWorld.java
java HelloWorld
```

(Needs a JDK installed — check with `java -version`. If missing, install
OpenJDK: `apt-get install default-jdk` on Debian/Ubuntu, or download from
https://adoptium.net.)

## Path

1. **01-basics** — variables, types, operators, input/output
2. **02-control-flow** — if/else, loops, switch
3. **03-oop** — classes, objects, inheritance, interfaces
4. **04-collections** — arrays, ArrayList, HashMap
5. **05-exceptions** — try/catch, custom exceptions

Work through them in order — each one builds on ideas from the last.
