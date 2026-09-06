// A class is a blueprint for objects. It bundles data (fields) with behavior (methods).
public class Dog {
    // Fields (state) — private so outside code can't mess with them directly
    private String name;
    private int age;

    // Constructor: runs when you create a new Dog with `new Dog(...)`
    public Dog(String name, int age) {
        this.name = name; // `this` refers to the current object's field
        this.age = age;
    }

    // Methods (behavior)
    public void bark() {
        System.out.println(name + " says Woof!");
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    // Try it out
    public static void main(String[] args) {
        Dog rex = new Dog("Rex", 3);      // create an object (an "instance")
        Dog buddy = new Dog("Buddy", 5);

        rex.bark();
        buddy.bark();

        System.out.println(rex.getName() + " is " + rex.getAge() + " years old.");
    }
}
