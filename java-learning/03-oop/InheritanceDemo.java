// Base class
class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + " is eating.");
    }

    // Meant to be overridden by subclasses
    public void makeSound() {
        System.out.println(name + " makes a sound.");
    }
}

// Cat inherits everything Animal has, and can override behavior
class Cat extends Animal {
    public Cat(String name) {
        super(name); // call the parent constructor
    }

    @Override
    public void makeSound() {
        System.out.println(name + " says Meow!");
    }
}

class Bird extends Animal {
    public Bird(String name) {
        super(name);
    }

    @Override
    public void makeSound() {
        System.out.println(name + " says Tweet!");
    }
}

public class InheritanceDemo {
    public static void main(String[] args) {
        Animal[] animals = { new Cat("Whiskers"), new Bird("Tweety") };

        // Polymorphism: same method call, different behavior per actual object type
        for (Animal a : animals) {
            a.eat();          // inherited, unchanged
            a.makeSound();    // overridden per subclass
        }
    }
}
