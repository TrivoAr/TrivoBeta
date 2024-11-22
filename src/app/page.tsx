import Image from "next/image";
function HomePage() {
  // const { data: session, status } = useSession({
  //   required: true,
  // });
  // console.log(session, status);

  return (
  <div>
    <Image src="/assets/Group 17.png" alt="Klubo Logo" width={120} height={120} />
    HomePage Bauti
    <h1>Klubo</h1>
  </div>);
}

export default HomePage;
